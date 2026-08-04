/** Server actions for configuring an event's post-play journey (internal only). */
"use server";

import { revalidatePath } from "next/cache";
import { requireInternalUser } from "@/lib/auth";
import { saveJourneySchema, type SaveJourneyInput } from "@/lib/validations/journeys";

/**
 * Create or replace the event's journey. One journey per event by
 * convention: an existing row is updated in place so its touch history
 * survives copy edits.
 */
export async function saveJourney(input: SaveJourneyInput) {
  const parsed = saveJourneySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const { supabase } = await requireInternalUser();
    const journey = parsed.data;

    const { data: existing } = await supabase
      .from("post_play_journeys")
      .select("id")
      .eq("event_id", journey.eventId)
      .limit(1)
      .maybeSingle();

    const row = {
      kind: journey.kind,
      headline: journey.headline,
      body: journey.body || null,
      cta_label: journey.ctaLabel,
      cta_url: journey.ctaUrl,
      discount_code: journey.discountCode || null,
      is_active: journey.isActive,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase
          .from("post_play_journeys")
          .update(row)
          .eq("id", existing.id)
      : await supabase
          .from("post_play_journeys")
          .insert({ ...row, event_id: journey.eventId });

    if (error) {
      console.error("[saveJourney] write failed:", error.message, {
        eventId: journey.eventId,
      });
      return { success: false as const, error: "Could not save the journey" };
    }

    revalidatePath(`/events/${journey.eventId}`);
    return { success: true as const, data: null };
  } catch {
    return { success: false as const, error: "Not authorised" };
  }
}
