/**
 * Inbound webhook handler for Cal.com bookings.
 *
 * INTEGRATION: Cal.com
 *
 * Cal.com POSTs here when a walkthrough call is booked, rescheduled,
 * cancelled, or finished. The quote id travels in `payload.metadata.quoteId`
 * (set by the inline embed in `WalkthroughScheduler`), which lets us keep the
 * quote as the source of truth:
 *
 *   - BOOKING_CREATED / BOOKING_RESCHEDULED — writes `walkthrough_scheduled_at`
 *     + `walkthrough_slot_label` onto the quote and pings the event lead
 *     in-portal (same archetype as the preset picker).
 *   - BOOKING_CANCELLED — clears the scheduled slot.
 *   - MEETING_ENDED — sets `walkthrough_completed_at`, which automatically
 *     reveals pricing + accept/decline on the customer proposal page.
 *
 * Bookings without a `quoteId` in metadata (e.g. made directly on the Cal.com
 * page rather than through the embed) are acknowledged and ignored so Cal.com
 * doesn't retry them.
 *
 * Webhook URL: POST /api/webhooks/calcom
 * Auth: HMAC-SHA256 hex digest of the raw body via `X-Cal-Signature-256`
 * Secret env: CALCOM_WEBHOOK_SECRET (paste the same secret in
 *   Cal.com → Settings → Developer → Webhooks)
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { verifySignature } from "@/lib/webhooks/verify";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { formatSlotLabel } from "@/lib/calcom";

const SIGNATURE_HEADER = "x-cal-signature-256";

interface CalcomPayload {
  startTime?: string;
  endTime?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: Request) {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);
  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const triggerEvent = String(body.triggerEvent ?? "");
  const payload = (body.payload ?? {}) as CalcomPayload;
  const quoteId =
    typeof payload.metadata?.quoteId === "string"
      ? payload.metadata.quoteId
      : null;

  if (!quoteId) {
    // Booking didn't originate from our embed — nothing to sync.
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    switch (triggerEvent) {
      case "BOOKING_CREATED":
      case "BOOKING_RESCHEDULED":
        await handleBookingScheduled(quoteId, payload);
        break;
      case "BOOKING_CANCELLED":
        await handleBookingCancelled(quoteId);
        break;
      case "MEETING_ENDED":
        await handleMeetingEnded(quoteId, payload);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown triggerEvent: ${triggerEvent}` },
          { status: 422 }
        );
    }

    revalidatePath(`/admin/quotes/${quoteId}`);
    revalidatePath("/admin/quotes");
    revalidatePath(`/proposal/${quoteId}`);
    return NextResponse.json({ received: true, triggerEvent });
  } catch (err) {
    Sentry.captureException(err, { tags: { webhook_trigger: triggerEvent } });
    console.error(`[webhook:calcom] ${triggerEvent} failed:`, err);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}

/* ───────────────────────── Handlers ───────────────────────── */

/** Record the booked (or rescheduled) slot on the quote and ping the AE. */
async function handleBookingScheduled(quoteId: string, payload: CalcomPayload) {
  const startTime = payload.startTime ? String(payload.startTime) : null;
  if (!startTime) throw new Error("Missing payload.startTime");

  const slotLabel = formatSlotLabel(startTime);
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("quotes")
    .update({
      walkthrough_scheduled_at: startTime,
      walkthrough_slot_label: slotLabel,
    })
    .eq("id", quoteId);
  if (error) throw new Error(`Quote update failed: ${error.message}`);

  // Same in-portal ping the preset picker fires — the AE sees the booked
  // meeting on the bell, the queue, and the quote detail.
  try {
    await dispatchNotification("proposal.walkthrough_booked", {
      quoteId,
      slotLabel: slotLabel ?? startTime,
      entityType: "quote",
      entityId: quoteId,
    });
  } catch (notifyError) {
    console.error("[webhook:calcom] notify failed", notifyError);
  }
}

/** Clear the scheduled slot when the customer cancels in Cal.com. */
async function handleBookingCancelled(quoteId: string) {
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("quotes")
    .update({
      walkthrough_scheduled_at: null,
      walkthrough_slot_label: null,
    })
    .eq("id", quoteId);
  if (error) throw new Error(`Quote update failed: ${error.message}`);
}

/**
 * Mark the walkthrough complete when the call ends. This is the flag that
 * reveals pricing + accept/decline on the proposal page, so the reveal happens
 * automatically instead of waiting for the AE's manual toggle.
 */
async function handleMeetingEnded(quoteId: string, payload: CalcomPayload) {
  const completedAt = payload.endTime
    ? String(payload.endTime)
    : new Date().toISOString();
  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from("quotes")
    .update({ walkthrough_completed_at: completedAt })
    .eq("id", quoteId);
  if (error) throw new Error(`Quote update failed: ${error.message}`);
}
