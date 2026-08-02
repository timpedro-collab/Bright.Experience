/** Track 2 (Proposal) intake server actions from the guided wizard. */
"use server";

import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { quoteLimiter, decisionLimiter, getClientIp } from "@/lib/rate-limit";
import { sanitiseCapabilitySlugs } from "@/lib/capabilities";
import { sendProposalIntakeNotification } from "@/lib/email";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { recordAttribution } from "@/app/actions/partners";
import { proposalIntakeSchema } from "@/lib/validations/quotes";
import { PARTNER_ATTRIBUTION_COOKIE } from "./constants";

/** Submit a Track 2 (Proposal) intake from the guided wizard.
 *
 * `addons` carries the canonical capability slugs the customer chose on the
 * match reveal — silently absorbed from URL params so the customer never sees
 * a configurator step. Untrusted input is filtered to the canonical list.
 */
export async function submitProposalIntake(data: {
  eventType: string;
  objective?: string;
  venueName?: string;
  postcode?: string;
  eventDateStart?: string;
  eventDateEnd?: string;
  machinePreference?: string;
  gamePreference?: string;
  /** Optional package slug carried from the quiz match (we resolve to UUID). */
  packageSlug?: string;
  footfallEstimate?: string;
  creativeNeeds?: string;
  specialRequirements?: string;
  engagementScope?: string;
  contactName: string;
  contactRole?: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  addons?: string[];
  // Quiz brief + projected reach (carried silently from the match card).
  reachTrack?: string;
  attendees?: number;
  activationLocation?: string;
  activationLocationKey?: string;
  activationDays?: number;
  eventTimeline?: string;
  estimatedImpressions?: number;
  estimatedInteractions?: number;
  estimatedLeads?: number;
  /** DOOH media value in integer USD cents. */
  doohMediaValue?: number;
}) {
  if (!(await quoteLimiter(await getClientIp()))) {
    return {
      success: false as const,
      error: "Too many submissions. Please wait a moment and try again.",
    };
  }

  const coreFields = proposalIntakeSchema.pick({
    eventType: true,
    contactName: true,
    contactEmail: true,
  });
  const parsed = coreFields.safeParse({
    eventType: data.eventType,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const addons = sanitiseCapabilitySlugs(data.addons);

  // Resolve the package slug → UUID up-front so we can store a real FK.
  let packageId: string | null = null;
  if (data.packageSlug) {
    const { data: pkg } = await supabase
      .from("packages")
      .select("id")
      .eq("slug", data.packageSlug)
      .maybeSingle();
    packageId = pkg?.id ?? null;
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      track: "proposal",
      status: "submitted",
      event_type: data.eventType,
      objective: data.objective ?? null,
      venue_name: data.venueName ?? null,
      postcode: data.postcode ?? null,
      event_date_start: data.eventDateStart ?? null,
      event_date_end: data.eventDateEnd ?? null,
      machine_preference: data.machinePreference ?? null,
      game_preference: data.gamePreference ?? null,
      package_id: packageId,
      footfall_estimate_text: data.footfallEstimate ?? null,
      creative_needs: data.creativeNeeds ?? null,
      special_requirements: data.specialRequirements ?? null,
      engagement_scope: data.engagementScope ?? null,
      contact_name: data.contactName,
      contact_role: data.contactRole ?? null,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone ?? null,
      company_name: data.companyName ?? null,
      addons,
      // Quiz brief + projected reach.
      reach_track: data.reachTrack || null,
      attendees: data.attendees ?? null,
      activation_location: data.activationLocation || null,
      activation_location_key: data.activationLocationKey || null,
      activation_days: data.activationDays ?? null,
      event_timeline: data.eventTimeline || null,
      estimated_impressions: data.estimatedImpressions ?? null,
      estimated_interactions: data.estimatedInteractions ?? null,
      estimated_leads: data.estimatedLeads ?? null,
      dooh_media_value: data.doohMediaValue ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submitProposalIntake] insert failed", error);
    return { success: false as const, error: "Failed to submit intake" };
  }

  // Partner attribution from the cookie set by /p/[code].
  const partnerCode = (await cookies()).get(PARTNER_ATTRIBUTION_COOKIE)?.value;
  if (partnerCode) {
    try {
      await recordAttribution({ partnerCode, quoteId: quote.id });
    } catch (attrError) {
      console.error("[submitProposalIntake] attribution failed", attrError);
    }
  }

  // Fire-and-forget AE handoff email. Capability slugs travel as structured
  // data so the AE sees the customer's outcome lines (not just slugs).
  try {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "https";
    await sendProposalIntakeNotification({
      quoteId: quote.id,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      companyName: data.companyName ?? null,
      eventType: data.eventType ?? null,
      venueName: data.venueName ?? null,
      capabilitySlugs: addons,
      portalUrl: `${proto}://${host}/admin/quotes/${quote.id}`,
    });
  } catch (notifyError) {
    console.error("[submitProposalIntake] notification failed", notifyError);
  }

  // In-portal AE ping — the existing email handoff above remains as the
  // structured outcomes-with-slugs reference; this gives the AE a row on
  // the bell + notifications page that ties back to the quote.
  try {
    await dispatchNotification("proposal.intake_received", {
      quoteId: quote.id,
      contactName: data.contactName,
      entityType: "quote",
      entityId: quote.id,
    });
  } catch (notifyError) {
    console.error("[submitProposalIntake] in-portal notify failed", notifyError);
  }

  revalidatePath("/admin/quotes");
  revalidatePath("/admin/customer-queue");
  return { success: true as const, data: { id: quote.id } };
}

/**
 * Book the in-app 15-minute walkthrough slot the customer picked on the
 * confirmation screen. Records the chosen time on the quote so the event lead
 * sees the booked meeting in their portal (queue + quote detail + home focus).
 */
export async function bookWalkthrough(
  quoteId: string,
  scheduledAt: string,
  slotLabel: string,
) {
  // Public confirmation-page action — throttle unauthenticated writes.
  if (!(await decisionLimiter(await getClientIp()))) {
    return {
      success: false as const,
      error: "Too many requests. Please wait a moment and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({
      walkthrough_scheduled_at: scheduledAt,
      walkthrough_slot_label: slotLabel,
    })
    .eq("id", quoteId);

  if (error) {
    return { success: false as const, error: "Couldn't book that slot. Please try another." };
  }

  // Ping the event lead so the booked meeting shows up in-portal.
  try {
    await dispatchNotification("proposal.walkthrough_booked", {
      quoteId,
      slotLabel,
      entityType: "quote",
      entityId: quoteId,
    });
  } catch (notifyError) {
    console.error("[bookWalkthrough] notify failed", notifyError);
  }

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  return { success: true as const, data: { scheduledAt, slotLabel } };
}

/**
 * Update the canonical capability slugs on a quote.
 *
 * Backs the "Adjust the experience" link on the confirmation screen — opens the
 * same RefineDrawer the match card used, and the customer's new selection is
 * pushed back to the quote so the AE sees the latest set.
 */
export async function updateQuoteCapabilities(
  quoteId: string,
  capabilitySlugs: string[]
) {
  // Public confirmation-page action — throttle unauthenticated writes.
  if (!(await decisionLimiter(await getClientIp()))) {
    return {
      success: false as const,
      error: "Too many requests. Please wait a moment and try again.",
    };
  }

  const supabase = await createClient();
  const addons = sanitiseCapabilitySlugs(capabilitySlugs);

  const { error } = await supabase
    .from("quotes")
    .update({ addons })
    .eq("id", quoteId);

  if (error) {
    return { success: false as const, error: "Failed to update capabilities" };
  }

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/quotes");
  revalidatePath(`/proposal/${quoteId}`);
  return { success: true as const, data: { id: quoteId, addons } };
}
