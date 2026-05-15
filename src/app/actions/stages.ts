"use server";

/** Server actions for event stage management */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { enqueueStageAdvance } from "@/lib/pipedrive/triggers";
import { STAGE_CONFIG } from "@/types";
import type { Stage } from "@/types";

const STAGE_ORDER: Stage[] = Object.entries(STAGE_CONFIG)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key]) => key as Stage);

/** Check whether all blocking tasks for the current stage are complete */
export async function canAdvanceStage(
  eventId: string
): Promise<{ canAdvance: boolean; blockers: string[] }> {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("current_stage")
    .eq("id", eventId)
    .single();

  if (!event) return { canAdvance: false, blockers: ["Event not found"] };

  const currentStage = event.current_stage as Stage;
  const currentOrder = STAGE_CONFIG[currentStage].order;
  const nextStage = STAGE_ORDER[currentOrder + 1];
  if (!nextStage) {
    return { canAdvance: false, blockers: ["Event is already at final stage"] };
  }

  const { data: blockingTasks } = await supabase
    .from("tasks")
    .select("id, title, status")
    .eq("event_id", eventId)
    .eq("is_blocking", true)
    .eq("category", currentStage)
    .not("status", "in", '("complete","skipped")');

  const blockers = (blockingTasks ?? []).map((t) => t.title);

  return { canAdvance: blockers.length === 0, blockers };
}

/** Advance the event to the next stage after verifying exit gates */
export async function advanceStage(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { canAdvance, blockers } = await canAdvanceStage(eventId);
  if (!canAdvance) {
    throw new Error(`Cannot advance: ${blockers.join(", ")}`);
  }

  const { data: event } = await supabase
    .from("events")
    .select("current_stage, name")
    .eq("id", eventId)
    .single();
  if (!event) throw new Error("Event not found");

  const currentStage = event.current_stage as Stage;
  const nextStage = STAGE_ORDER[STAGE_CONFIG[currentStage].order + 1];

  const { error } = await supabase
    .from("events")
    .update({ current_stage: nextStage, updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) throw new Error(`Failed to advance stage: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "stage_advanced",
    entity_type: "event",
    entity_id: eventId,
    metadata: { from: currentStage, to: nextStage },
  });

  const label = STAGE_CONFIG[nextStage].label;
  await dispatchNotification("stage.changed", {
    eventId,
    actorId: user.id,
    eventName: event.name,
    stageLabel: label,
    entityType: "event",
    entityId: eventId,
  });

  // Pipedrive: fire-and-forget write-back. Silently no-ops when the
  // event isn't linked to a deal or the integration is unconfigured.
  await enqueueStageAdvance(eventId, nextStage);

  revalidatePath(`/events/${eventId}`);
}
