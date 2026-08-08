/**
 * Post-play journey engine — sends the branded where-to-buy / review /
 * discount follow-up when a lead is captured, and records the funnel.
 *
 * Called from the Bright.Blue webhook ingest (lead.captured), so it uses the
 * service-role client. It never throws: a follow-up email must not be able to
 * fail the lead insert that triggered it.
 */
import "server-only";

import { Resend } from "resend";
import { getEventMetricTotals } from "@/lib/queries/event-metrics";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { escapeHtml } from "@/lib/notifications/email-shell";

// INTEGRATION: Resend — same client convention as src/lib/email.ts.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@brightblue.co.uk";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type JourneyTouch = "sent" | "opened" | "clicked" | "redeemed";

interface JourneyLead {
  id: string;
  eventId: string;
  contactEmail: string;
  contactName: string | null;
  emailStatus: string;
}

/**
 * Send the event's active journey to a freshly captured lead.
 *
 * Skips (without error) when: no active journey, Resend unconfigured, the
 * email failed quality screening, or this lead was already sent the journey
 * (the unique (journey, lead, touch) constraint is the idempotency guard).
 * Returns what happened so the caller can log it.
 */
export async function sendPostPlayJourney(
  lead: JourneyLead,
): Promise<{ sent: boolean; skipped?: string }> {
  try {
    // Only verified addresses get brand email — sending to disposable or
    // invalid addresses burns sender reputation for zero conversions.
    if (lead.emailStatus !== "verified") {
      return { sent: false, skipped: `email_status ${lead.emailStatus}` };
    }

    const supabase = getServiceRoleClient();
    const { data: journey } = await supabase
      .from("post_play_journeys")
      .select("id, kind, headline, body, cta_label, cta_url, discount_code")
      .eq("event_id", lead.eventId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!journey) return { sent: false, skipped: "no active journey" };
    if (!resend) return { sent: false, skipped: "resend not configured" };

    // Idempotency: insert the `sent` touch first; a conflict means this lead
    // already received the journey (e.g. a replayed webhook batch).
    const { error: touchError } = await supabase.from("journey_touches").insert({
      journey_id: journey.id,
      lead_id: lead.id,
      touch: "sent",
    });
    if (touchError) return { sent: false, skipped: "already sent" };

    const track = (touch: "opened" | "clicked") =>
      `${SITE_URL}/api/journeys/track?j=${journey.id}&l=${lead.id}&t=${touch}`;

    const metricTotals = await getEventMetricTotals(lead.eventId);
    let performance: { plays: number; leads: number; eventName: string } | null =
      null;
    if (metricTotals && metricTotals.totalPlays > 0) {
      const { data: event } = await supabase
        .from("events")
        .select("name")
        .eq("id", lead.eventId)
        .maybeSingle();
      performance = {
        plays: metricTotals.totalPlays,
        leads: metricTotals.totalLeads,
        eventName: event?.name ?? "this event",
      };
    }

    const firstName = (lead.contactName ?? "").trim().split(/\s+/)[0] || "there";
    const html = renderJourneyEmail({
      firstName,
      headline: journey.headline,
      body: journey.body,
      ctaLabel: journey.cta_label,
      clickUrl: track("clicked"),
      pixelUrl: track("opened"),
      discountCode: journey.discount_code,
      performance,
      resultCardUrl: `${SITE_URL}/play/${lead.id}`,
    });

    await resend.emails.send({
      from: `Bright.Experience <${FROM_EMAIL}>`,
      to: [lead.contactEmail],
      subject: journey.headline,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error("[journeys] send failed:", err);
    return { sent: false, skipped: "send error" };
  }
}

/**
 * Record an open/click/redeem touch. Duplicate touches are ignored — the
 * funnel counts leads, not raw hits.
 */
export async function recordJourneyTouch(
  journeyId: string,
  leadId: string,
  touch: Exclude<JourneyTouch, "sent">,
): Promise<void> {
  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("journey_touches").insert({
    journey_id: journeyId,
    lead_id: leadId,
    touch,
  });
  // 23505 (unique violation) is the expected repeat-hit case; anything else is worth a log.
  if (error && error.code !== "23505") {
    console.error(`[journeys] touch ${touch} failed:`, error.message);
  }
}

/** Resolve a journey's redirect target for the click-tracking route. */
export async function getJourneyCtaUrl(journeyId: string): Promise<string | null> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("post_play_journeys")
    .select("cta_url")
    .eq("id", journeyId)
    .maybeSingle();
  return data?.cta_url ?? null;
}

/** The branded follow-up email. Inline styles only — email clients ignore stylesheets. */
function renderJourneyEmail({
  firstName,
  headline,
  body,
  ctaLabel,
  clickUrl,
  pixelUrl,
  discountCode,
  performance,
  resultCardUrl,
}: {
  firstName: string;
  headline: string;
  body: string | null;
  ctaLabel: string;
  clickUrl: string;
  pixelUrl: string;
  discountCode: string | null;
  performance?: { plays: number; leads: number; eventName: string } | null;
  resultCardUrl?: string | null;
}): string {
  const organiserBlock =
    performance && performance.plays > 0
      ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin: 28px 0 8px;">
           <p style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin: 0 0 12px;">FOR THE ORGANISER IN THE ROOM</p>
           <p style="font-size: 14px; color: #111827; margin: 0 0 8px;"><strong>This experience has powered ${performance.plays.toLocaleString("en-GB")} plays and ${performance.leads.toLocaleString("en-GB")} opted-in leads at ${escapeHtml(performance.eventName)} so far.</strong></p>
           <p style="font-size: 14px; color: #374151; margin: 0 0 12px;">Machines like this one are booked for product launches, exhibitions and venue activations across the UK.</p>
           <p style="margin: 0;"><a href="${SITE_URL}/book?utm_source=post_play_email&amp;utm_medium=email&amp;utm_campaign=invitation" style="color: #2743EE; text-decoration: underline; font-size: 14px;">Bring this to your event →</a></p>
         </div>`
      : "";

  const resultBlock = resultCardUrl
    ? `<p style="text-align: center; margin: 4px 0 0;">
         <a href="${resultCardUrl}" style="color: #2743EE; text-decoration: underline; font-size: 13px;">See your result — score, rank, and a card worth bragging with →</a>
       </p>`
    : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #0D1137; padding: 24px 32px; border-radius: 16px 16px 0 0;">
        <h1 style="color: #ffffff; font-size: 18px; margin: 0;">${escapeHtml(headline)}</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
        <p style="color: #111827; font-size: 14px;">Hi ${escapeHtml(firstName)},</p>
        ${body ? `<p style="color: #374151; font-size: 14px; white-space: pre-line;">${escapeHtml(body)}</p>` : ""}
        ${
          discountCode
            ? `<p style="text-align: center; margin: 24px 0;">
                 <span style="display: inline-block; background: #f3f4f6; border: 1px dashed #9ca3af; padding: 10px 20px; border-radius: 8px; font-family: monospace; font-size: 16px; letter-spacing: 2px; color: #111827;">${escapeHtml(discountCode)}</span>
               </p>`
            : ""
        }
        <p style="text-align: center; margin: 28px 0 8px;">
          <a href="${clickUrl}" style="display: inline-block; background: #246BFD; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">${escapeHtml(ctaLabel)}</a>
        </p>
        ${resultBlock}
        ${organiserBlock}
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px;">
          You played a Bright.Experience activation and shared your details. This is a one-off message — there's no list to unsubscribe from.
        </p>
      </div>
      <img src="${pixelUrl}" width="1" height="1" alt="" style="display: block;" />
    </div>
  `;
}
