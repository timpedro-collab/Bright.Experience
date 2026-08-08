"use server";

/**
 * Conversion action for the public sponsor pitch page.
 *
 * The pitch link was a dead end: a sponsor could read the whole case for the
 * slot and then had to go find an email address. This is the "yes" — it holds
 * the slot for them and tells the organizer running the show.
 *
 * Unauthenticated by design, so the guards matter:
 *   - the pitch token is the credential, re-validated here (match + expiry)
 *     rather than trusted from the form,
 *   - the caller is rate-limited by IP,
 *   - only ever moves one slot from `available` to `reserved`, and only the
 *     slot the token resolves to.
 */

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getSlotByPitchToken } from "@/lib/queries/organizers";
import { firstRelated } from "@/lib/queries/embed";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { logQueryError } from "@/lib/observability/log-query-error";
import { recordLoopEvent } from "@/server/loop-events";
import { PITCH_UNLOCK_COOKIE } from "@/lib/sponsor-pitch";
import {
  pitchUnlockSchema,
  sponsorInterestSchema,
  type PitchUnlockInput,
  type SponsorInterestInput,
} from "@/lib/validations/sponsor-pitch";
import type { ActionResult } from "@/types/actions";

/** One sponsor, one decision — a tight bucket is plenty. */
const sponsorInterestLimiter = createRateLimiter({
  maxTokens: 5,
  refillRate: 0.1,
  prefix: "sponsor-interest",
});

/**
 * Register a sponsor's interest in the slot their pitch link points at.
 *
 * @returns the slot id when the hold is placed.
 */
export async function expressSponsorInterest(
  input: SponsorInterestInput
): Promise<ActionResult<{ slotId: string }>> {
  const parsed = sponsorInterestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { token, contactName, email, company, message } = parsed.data;

  if (!(await sponsorInterestLimiter(await getClientIp()))) {
    return {
      success: false,
      error: "Too many requests. Please try again in a few minutes.",
    };
  }

  // Re-validates match and expiry; returns null for an unknown or stale token.
  const slot = await getSlotByPitchToken(token);
  if (!slot) {
    return {
      success: false,
      error: "This link has expired. Ask your show contact for a fresh one.",
    };
  }

  const slotId = String(slot.id);
  const eventId = slot.event_id ? String(slot.event_id) : null;
  const status = String(slot.status);
  if (status !== "available" && status !== "reserved") {
    return {
      success: false,
      error: "This slot is no longer open. Your show contact can find another.",
    };
  }

  const supabase = getServiceRoleClient();
  const sponsorName = company || contactName;

  const { data: existing } = await supabase
    .from("sponsorship_slots")
    .select("game_config_json")
    .eq("id", slotId)
    .maybeSingle();

  const gameConfig: Record<string, unknown> = {
    ...((existing?.game_config_json as Record<string, unknown>) ?? {}),
    source: "sponsor_pitch",
    enquiry: {
      company: company ?? null,
      contactName,
      email,
      message: message ?? null,
      requestedAt: new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({
      status: "reserved",
      sponsor_name: slot.sponsor_name ?? sponsorName,
      game_config_json: gameConfig,
    })
    .eq("id", slotId);

  if (error) {
    logQueryError("expressSponsorInterest", error, { slotId });
    return {
      success: false,
      error: "Couldn't send that. Please try again, or reply to your contact.",
    };
  }

  if (eventId) {
    // The organizer link needs their portal slug, which lives on the partner.
    const { data: event } = await supabase
      .from("events")
      .select("name, partners:organizer_partner_id ( slug )")
      .eq("id", eventId)
      .maybeSingle();
    const partner = firstRelated<{ slug?: string }>(event?.partners);

    await dispatchNotification(
      "sponsor.interest_received",
      {
        eventId,
        eventName: (event?.name as string) ?? "your show",
        sponsorName,
        contactName,
        contactEmail: email,
        organizerSlug: partner?.slug ?? "",
        entityType: "sponsorship_slot",
        entityId: slotId,
      },
      { supabaseClient: supabase }
    );

    revalidatePath(`/organizers`);
  }

  revalidatePath(`/sponsor/${token}`);
  return { success: true, data: { slotId } };
}

/**
 * Unlock the detailed numbers on a pitch page in exchange for light identity.
 *
 * Viewing the pitch stays free; only the expected/actual performance figures
 * sit behind this. The identity lands in loop_events for nurture — it does
 * not reserve the slot or notify anyone.
 *
 * @returns the slot id when the unlock is recorded.
 */
export async function unlockPitchDetails(
  input: PitchUnlockInput
): Promise<ActionResult<{ slotId: string }>> {
  const parsed = pitchUnlockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { token, contactName, email, company } = parsed.data;

  if (!(await sponsorInterestLimiter(await getClientIp()))) {
    return {
      success: false,
      error: "Too many requests. Please try again in a few minutes.",
    };
  }

  const slot = await getSlotByPitchToken(token);
  if (!slot) {
    return {
      success: false,
      error: "This link has expired. Ask your show contact for a fresh one.",
    };
  }

  const slotId = String(slot.id);
  await recordLoopEvent("pitch_unlock", {
    artifact: "sponsor_pitch",
    eventId: slot.event_id ? String(slot.event_id) : null,
    metadata: { slotId, contactName, email, company: company ?? null },
  });

  // Remember the unlock per-browser so a returning sponsor isn't re-gated.
  const jar = await cookies();
  const existing = jar.get(PITCH_UNLOCK_COOKIE)?.value ?? "";
  const unlocked = new Set(existing.split(",").filter(Boolean));
  unlocked.add(slotId);
  jar.set(PITCH_UNLOCK_COOKIE, [...unlocked].join(","), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 90 * 24 * 60 * 60,
    path: "/sponsor",
  });

  revalidatePath(`/sponsor/${token}`);
  return { success: true, data: { slotId } };
}
