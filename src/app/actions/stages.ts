"use server";

/**
 * Stage transition server actions.
 *
 * Exit-gate checks look at **stage-linked blocking tasks**: a task is
 * considered a gate when `is_blocking=true` and it lives on a milestone
 * whose `stage = events.current_stage` (or carries no milestone — those
 * count as global-to-the-event). The previous implementation filtered
 * `tasks.category = current_stage`, which compared two unrelated enums
 * (`task_category` vs `event_stage`) and let advance always pass.
 *
 * On a successful advance we also walk the milestone status:
 *   - any milestone on the outgoing stage that's still `in_progress`
 *     gets marked `complete`,
 *   - any milestone on the incoming stage that's still `pending`
 *     gets marked `in_progress`.
 */

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

  // Resolve milestones for this stage so we can filter blocking tasks.
  const { data: stageMilestones } = await supabase
    .from("milestones")
    .select("id")
    .eq("event_id", eventId)
    .eq("stage", currentStage);

  const milestoneIds = (stageMilestones ?? []).map((m) => m.id as string);

  // Two task categories block: tasks tied to a current-stage milestone,
  // and free-floating tasks (no milestone_id) — treat the latter as
  // event-global blockers.
  let query = supabase
    .from("tasks")
    .select("id, title, status, milestone_id")
    .eq("event_id", eventId)
    .eq("is_blocking", true)
    .not("status", "in", '("complete","skipped")');

  if (milestoneIds.length > 0) {
    query = query.or(
      `milestone_id.is.null,milestone_id.in.(${milestoneIds.join(",")})`
    );
  } else {
    query = query.is("milestone_id", null);
  }

  const { data: blockingTasks } = await query;
  const blockers = (blockingTasks ?? []).map(
    (t: { title: string }) => t.title
  );

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
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("events")
    .update({ current_stage: nextStage, updated_at: now })
    .eq("id", eventId);

  if (error) throw new Error(`Failed to advance stage: ${error.message}`);

  // Sync milestones so the timeline stays in lock-step with the event.
  // Best-effort — failures here don't block the advance, but we log them
  // for debugging.
  try {
    await supabase
      .from("milestones")
      .update({
        status: "complete",
        completed_at: now,
        completed_by: user.id,
      })
      .eq("event_id", eventId)
      .eq("stage", currentStage)
      .eq("status", "in_progress");
    await supabase
      .from("milestones")
      .update({ status: "in_progress" })
      .eq("event_id", eventId)
      .eq("stage", nextStage)
      .eq("status", "pending");
  } catch (err) {
    console.warn("Milestone sync after stage advance failed", err);
  }

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
  revalidatePath(`/events/${eventId}/timeline`);
  return { from: currentStage, to: nextStage };
}
