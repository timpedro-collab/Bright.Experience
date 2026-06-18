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
import { getUser } from "@/lib/auth";
import { canAdvanceEventStage } from "@/lib/roles";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { enqueueStageAdvance } from "@/lib/pipedrive/triggers";
import { writeAudit } from "@/lib/audit";
import { checkComplianceForStageGate } from "./compliance";
import { createHandoffNote } from "./handoff-notes";
import { bumpStreak } from "./streak";
import { STAGE_CONFIG } from "@/types";
import type { Stage } from "@/types";
import type { ActionResult } from "@/types/actions";

const STAGE_ORDER: Stage[] = Object.entries(STAGE_CONFIG)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([key]) => key as Stage);

/** Check whether all blocking tasks for the current stage are complete. */
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

  const { data: stageMilestones } = await supabase
    .from("milestones")
    .select("id")
    .eq("event_id", eventId)
    .eq("stage", currentStage);

  const milestoneIds = (stageMilestones ?? []).map((m) => m.id as string);

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

  const complianceGateStages: Stage[] = ["logistics_confirmed", "qa_readiness"];
  if (complianceGateStages.includes(nextStage)) {
    const compliance = await checkComplianceForStageGate(eventId);
    if (!compliance.passed) {
      for (const doc of compliance.missing) {
        blockers.push(`Missing compliance: ${doc}`);
      }
    }
  }

  // QA sign-off gate: leaving qa_readiness requires every QA item to be
  // passed/fixed/na — the readiness score is not just cosmetic.
  if (currentStage === "qa_readiness") {
    const { data: outstandingQa } = await supabase
      .from("qa_items")
      .select("id", { count: "exact" })
      .eq("event_id", eventId)
      .not("status", "in", '("passed","fixed","na")');
    const outstandingCount = outstandingQa?.length ?? 0;
    if (outstandingCount > 0) {
      blockers.push(
        `${outstandingCount} QA check${outstandingCount === 1 ? "" : "s"} still outstanding`,
      );
    }
  }

  return { canAdvance: blockers.length === 0, blockers };
}

/** Advance the event to the next stage after verifying exit gates. */
export async function advanceStage(
  eventId: string
): Promise<ActionResult<{ from: Stage; to: Stage }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const profile = await getUser();
  if (!profile || !canAdvanceEventStage(profile.role)) {
    return {
      success: false,
      error: "Only the Events Lead or an admin can advance stages.",
    };
  }

  const { canAdvance, blockers } = await canAdvanceStage(eventId);
  if (!canAdvance) {
    return { success: false, error: `Cannot advance: ${blockers.join(", ")}` };
  }

  const { data: event } = await supabase
    .from("events")
    .select("current_stage, name")
    .eq("id", eventId)
    .single();
  if (!event) return { success: false, error: "Event not found" };

  const currentStage = event.current_stage as Stage;
  const nextStage = STAGE_ORDER[STAGE_CONFIG[currentStage].order + 1];
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("events")
    .update({ current_stage: nextStage, updated_at: now })
    .eq("id", eventId);

  if (error) return { success: false, error: `Failed to advance stage: ${error.message}` };

  // Sync milestones — best-effort, failures don't block the advance.
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

  await writeAudit({
    eventId,
    actorId: user.id,
    action: "stage_advanced",
    entityType: "event",
    entityId: eventId,
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

  await enqueueStageAdvance(eventId, nextStage);
  bumpStreak().catch(() => {});

  const fromLabel = STAGE_CONFIG[currentStage].label;
  const toLabel = STAGE_CONFIG[nextStage].label;
  createHandoffNote(eventId, currentStage, nextStage, {
    whatsDone: `Stage "${fromLabel}" completed.`,
    whatsPending: `Stage "${toLabel}" now in progress.`,
  }).catch(() => {});

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/timeline`);
  revalidatePath("/pipeline");
  revalidatePath("/ops");
  revalidatePath("/");
  return { success: true, data: { from: currentStage, to: nextStage } };
}
