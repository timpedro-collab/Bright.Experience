/**
 * Loop-pulse telemetry writer — records self-promotion loop touches
 * (invitation landings, pitch unlocks, card views) via the service role.
 * Fire-and-forget: a failed write must never affect the visitor's page.
 */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export type LoopEventKind =
  | "invitation_landing"
  | "pitch_unlock"
  | "player_card_view"
  | "report_view";

export async function recordLoopEvent(
  kind: LoopEventKind,
  opts: {
    artifact?: string | null;
    eventId?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("loop_events").insert({
      kind,
      artifact: opts.artifact ?? null,
      event_id: opts.eventId ?? null,
      metadata: opts.metadata ?? {},
    });
    if (error) {
      console.error("[loop-events] insert failed", { kind, error: error.message });
    }
  } catch (err) {
    console.error("[loop-events] insert threw", { kind, err });
  }
}
