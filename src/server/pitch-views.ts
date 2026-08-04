/** Records that a sponsor opened a pitch link, so the rep can see engagement. */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Bump the open counter on a slot's pitch link. Counts only — no visitor
 * identity is recorded. Fire-and-forget: a failed count must never break
 * the pitch page, so errors are logged and swallowed.
 */
export async function recordPitchView(slotId: string): Promise<void> {
  try {
    const supabase = getServiceRoleClient();

    const { data: slot } = await supabase
      .from("sponsorship_slots")
      .select("pitch_view_count")
      .eq("id", slotId)
      .maybeSingle();
    if (!slot) return;

    await supabase
      .from("sponsorship_slots")
      .update({
        pitch_view_count: (Number(slot.pitch_view_count) || 0) + 1,
        pitch_last_viewed_at: new Date().toISOString(),
      })
      .eq("id", slotId);
  } catch (error) {
    console.error("[recordPitchView] failed", { slotId, error });
  }
}
