/**
 * Stage transition history.
 *
 * Read-only audit-log query. `audit_entries` is the single source of
 * truth for who advanced an event to which stage and when — there is
 * no separate `stage_transitions` table. We map the metadata blob
 * (`{ from, to }`) into a typed shape so the timeline can render
 * "Advanced to {to}" markers without doing the cast at every render.
 */

import { createClient } from "@/lib/supabase/server";
import type { Stage } from "@/types";

export interface StageTransition {
  id: string;
  eventId: string;
  actorId: string | null;
  actorName?: string | null;
  fromStage: Stage;
  toStage: Stage;
  occurredAt: string;
}

export async function getStageTransitions(
  eventId: string
): Promise<StageTransition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_entries")
    .select(
      "id, event_id, actor_id, action, metadata, created_at, actor:profiles!audit_entries_actor_id_fkey(name)"
    )
    .eq("event_id", eventId)
    .eq("action", "stage_advanced")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data
    .map((row: Record<string, unknown>): StageTransition | null => {
      const meta = (row.metadata ?? {}) as { from?: string; to?: string };
      if (!meta.from || !meta.to) return null;
      const actor = row.actor as { name?: string } | null;
      return {
        id: row.id as string,
        eventId: row.event_id as string,
        actorId: (row.actor_id as string | null) ?? null,
        actorName: actor?.name ?? null,
        fromStage: meta.from as Stage,
        toStage: meta.to as Stage,
        occurredAt: row.created_at as string,
      };
    })
    .filter((t): t is StageTransition => t !== null);
}
