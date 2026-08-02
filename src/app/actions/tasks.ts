"use server";

/**
 * Task lifecycle server actions.
 *
 * Tasks gate stage advancement — a blocking task in status !== complete
 * prevents `advanceStage` from proceeding. These actions let both
 * customers ("Upload your logo") and internal users ("Configure game
 * logic") mark work as done without touching the DB directly.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { isInternalRole, isAdminRole } from "@/lib/roles";
import { reassignTaskSchema, type ReassignTaskInput } from "@/lib/validations/tasks";
import { bumpStreak } from "./streak";
import type { ActionResult } from "@/types/actions";
import type { UserRole } from "@/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Resolve the caller's role from their profile (request-scoped client). */
async function getActorRole(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserRole | undefined> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data?.role as UserRole | undefined) ?? undefined;
}

/**
 * Mark a task as complete — clears blocking gates when applicable.
 *
 * Ownership is enforced here so neither side ticks off the other's work
 * by accident: customers can't complete internal delivery tasks, and
 * internal staff can only complete a `customer_action` task on the
 * customer's behalf via the explicit `onBehalf` flag (audited).
 */
export async function completeTask(
  taskId: string,
  onBehalf = false
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("tasks")
    .select("task_type")
    .eq("id", taskId)
    .maybeSingle();
  if (!existing) {
    return { success: false, error: "Could not complete task — it may already be done." };
  }

  const actorRole = await getActorRole(supabase, user.id);
  const actingInternal = actorRole ? isInternalRole(actorRole) : false;
  const isCustomerTask = existing.task_type === "customer_action";
  if (actingInternal && isCustomerTask && !onBehalf) {
    return {
      success: false,
      error:
        "This is the customer's task. Use “Mark done for customer” to complete it on their behalf.",
    };
  }
  if (!actingInternal && !isCustomerTask) {
    return {
      success: false,
      error: "The Bright.Blue team will complete this step for you.",
    };
  }

  const now = new Date().toISOString();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      status: "complete",
      completed_at: now,
      completed_by: user.id,
    })
    .eq("id", taskId)
    .not("status", "in", '("complete","skipped")')
    .select("id, event_id, title, is_blocking")
    .single();

  if (error || !task) {
    return { success: false, error: "Could not complete task — it may already be done." };
  }

  await supabase.from("audit_entries").insert({
    event_id: task.event_id,
    actor_id: user.id,
    action: "task_completed",
    entity_type: "task",
    entity_id: taskId,
    metadata: {
      title: task.title,
      onBehalfOfCustomer: actingInternal && isCustomerTask && onBehalf ? true : undefined,
      actorRole,
    },
  });

  if (task.is_blocking) {
    const { data: eventRow } = await supabase
      .from("events")
      .select("name")
      .eq("id", task.event_id)
      .single();

    await dispatchNotification("task.completed", {
      eventId: task.event_id,
      taskId,
      actorId: user.id,
      taskTitle: task.title,
      eventName: eventRow?.name ?? "your event",
      wasBlocking: true,
      entityType: "task",
      entityId: taskId,
    });
  }

  bumpStreak().catch(() => {});

  revalidatePath(`/events/${task.event_id}/actions`);
  revalidatePath(`/events/${task.event_id}`);
  revalidatePath(`/events/${task.event_id}/timeline`);
  revalidatePath("/inbox");
  revalidatePath("/");
  return { success: true, data: undefined };
}

/**
 * Reopen a completed or skipped task — powers the "Undo" affordance on the
 * task checklist toasts. Restores the task to an open status (default
 * `in_progress`, or `pending` when the caller knows it hadn't been started),
 * clears the completion stamp, and audits the reversal.
 *
 * Ownership mirrors `completeTask`: customers can only reopen their own
 * `customer_action` tasks; internal users can reopen anything.
 */
export async function reopenTask(
  taskId: string,
  restoreStatus: "pending" | "in_progress" = "in_progress"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("tasks")
    .select("task_type, status")
    .eq("id", taskId)
    .maybeSingle();
  if (!existing) {
    return { success: false, error: "That task no longer exists." };
  }
  if (existing.status !== "complete" && existing.status !== "skipped") {
    return { success: false, error: "That task is already open." };
  }

  const actorRole = await getActorRole(supabase, user.id);
  const actingInternal = actorRole ? isInternalRole(actorRole) : false;
  if (!actingInternal && existing.task_type !== "customer_action") {
    return {
      success: false,
      error: "Only the Bright.Blue team can reopen this task.",
    };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      status: restoreStatus,
      completed_at: null,
      completed_by: null,
    })
    .eq("id", taskId)
    .select("id, event_id, title")
    .single();

  if (error || !task) {
    return { success: false, error: "Could not reopen task." };
  }

  await supabase.from("audit_entries").insert({
    event_id: task.event_id,
    actor_id: user.id,
    action: "task_reopened",
    entity_type: "task",
    entity_id: taskId,
    metadata: { title: task.title, restoredTo: restoreStatus, actorRole },
  });

  revalidatePath(`/events/${task.event_id}/actions`);
  revalidatePath(`/events/${task.event_id}`);
  revalidatePath(`/events/${task.event_id}/timeline`);
  revalidatePath("/inbox");
  revalidatePath("/");
  return { success: true, data: undefined };
}

/** Skip a task (internal only) — records reason for audit trail. */
export async function skipTask(taskId: string, reason?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const actorRole = await getActorRole(supabase, user.id);
  if (!actorRole || !isInternalRole(actorRole)) {
    return { success: false, error: "Only the Bright.Blue team can skip tasks." };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
      completed_by: user.id,
    })
    .eq("id", taskId)
    .not("status", "in", '("complete","skipped")')
    .select("id, event_id, title")
    .single();

  if (error || !task) {
    return { success: false, error: "Could not skip task — it may already be resolved." };
  }

  await supabase.from("audit_entries").insert({
    event_id: task.event_id,
    actor_id: user.id,
    action: "task_skipped",
    entity_type: "task",
    entity_id: taskId,
    metadata: { title: task.title, reason },
  });

  revalidatePath(`/events/${task.event_id}/actions`);
  revalidatePath(`/events/${task.event_id}`);
  revalidatePath(`/events/${task.event_id}/timeline`);
  revalidatePath("/inbox");
  revalidatePath("/");
  return { success: true, data: undefined };
}

/** Move a pending task to in_progress. */
export async function startTask(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ status: "in_progress" })
    .eq("id", taskId)
    .eq("status", "pending")
    .select("id, event_id")
    .single();

  if (error || !task) {
    return { success: false, error: "Could not start task." };
  }

  revalidatePath(`/events/${task.event_id}/actions`);
  revalidatePath(`/events/${task.event_id}`);
  revalidatePath("/inbox");
  revalidatePath("/");
  return { success: true, data: undefined };
}

/**
 * Send the customer a reminder about an outstanding task they own.
 *
 * This is the ONLY action an internal user takes on a `customer_action`
 * task from their own surfaces: they don't do the work, they nudge the
 * party who does. We reuse the existing customer notification archetypes
 * (briefing / asset upload / approval), picked from the task's target path,
 * so the customer gets a real in-portal ping + email with the right link.
 */
export async function remindCustomerTask(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const actorRole = await getActorRole(supabase, user.id);
  if (!actorRole || !isInternalRole(actorRole)) {
    return { success: false, error: "Only the Bright.Blue team can send reminders." };
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, event_id, title, task_type, target_path, status")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return { success: false, error: "That task no longer exists." };
  if (task.task_type !== "customer_action") {
    return { success: false, error: "Only customer tasks can be nudged." };
  }
  if (task.status === "complete" || task.status === "skipped") {
    return { success: false, error: "That task is already done — nothing to chase." };
  }

  const { data: eventRow } = await supabase
    .from("events")
    .select("name")
    .eq("id", task.event_id)
    .maybeSingle();

  // Map the task's destination to the closest customer archetype so the
  // reminder deep-links to where the work is actually done.
  const path = (task.target_path as string | null) ?? "";
  const kind =
    path === "briefing"
      ? "briefing.needed"
      : path === "approvals"
        ? "approval.requested"
        : "asset.upload_needed";

  await dispatchNotification(kind, {
    eventId: task.event_id,
    eventName: eventRow?.name ?? "your event",
    taskTitle: task.title,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
  });

  await supabase.from("audit_entries").insert({
    event_id: task.event_id,
    actor_id: user.id,
    action: "customer_reminder_sent",
    entity_type: "task",
    entity_id: taskId,
    metadata: { title: task.title, actorRole },
  });

  revalidatePath(`/events/${task.event_id}`);
  return { success: true, data: undefined };
}

/**
 * Which internal role a task's team lane routes to — keeps `assigned_role`
 * consistent with the lane so "Your actions" filters keep working after a
 * reassignment. Mirrors `OWNER_TO_INTERNAL_ROLE` in `src/lib/ownership.ts`.
 */
const CATEGORY_TO_ASSIGNED_ROLE: Record<string, UserRole> = {
  creative: "creative_lead",
  operations: "operations_lead",
  qa: "qa_lead",
  development: "admin",
  logistics: "operations_lead",
  reporting: "events_lead",
};

/**
 * Reassign an internal task to a different team lane and/or person.
 *
 * Orchestration is the Events Lead's job — only orchestrator roles
 * (events_lead, admin) may move work between teams. Customer tasks are
 * never reassignable: they belong to the customer, and the correct
 * internal action on them is a reminder, not a reassignment.
 */
export async function reassignTask(
  input: ReassignTaskInput
): Promise<ActionResult> {
  const parsed = reassignTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { taskId, category, assignedToId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const actorRole = await getActorRole(supabase, user.id);
  if (!actorRole || !isAdminRole(actorRole)) {
    return { success: false, error: "Only an orchestrator can reassign work." };
  }

  const { data: existing } = await supabase
    .from("tasks")
    .select("id, event_id, title, task_type, category, assigned_to, status")
    .eq("id", taskId)
    .maybeSingle();
  if (!existing) return { success: false, error: "That task no longer exists." };
  if (existing.task_type === "customer_action") {
    return {
      success: false,
      error: "Customer tasks belong to the customer — send a reminder instead.",
    };
  }
  if (existing.status === "complete" || existing.status === "skipped") {
    return { success: false, error: "That task is already resolved." };
  }

  const updateData: Record<string, unknown> = {};
  if (category !== undefined) {
    updateData.category = category;
    updateData.assigned_role = CATEGORY_TO_ASSIGNED_ROLE[category];
    // Moving lanes clears a stale personal assignment unless the caller
    // names a new assignee in the same call.
    if (assignedToId === undefined) updateData.assigned_to = null;
  }
  if (assignedToId !== undefined) updateData.assigned_to = assignedToId;

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId);
  if (error) return { success: false, error: `Reassignment failed: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: existing.event_id,
    actor_id: user.id,
    action: "task_reassigned",
    entity_type: "task",
    entity_id: taskId,
    metadata: {
      title: existing.title,
      fromCategory: existing.category,
      toCategory: category ?? existing.category,
      fromAssignedTo: existing.assigned_to,
      toAssignedTo: assignedToId === undefined ? null : assignedToId,
      actorRole,
    },
  });

  revalidatePath(`/events/${existing.event_id}/actions`);
  revalidatePath(`/events/${existing.event_id}`);
  revalidatePath("/inbox");
  revalidatePath("/");
  return { success: true, data: undefined };
}

/**
 * Snooze an internal task until a future timestamp — hides it from focus
 * and inbox queues until the snooze expires. Internal roles only.
 */
export async function snoozeTask(
  taskId: string,
  until: string,
): Promise<ActionResult<{ snoozedUntil: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const actorRole = await getActorRole(supabase, user.id);
  if (!actorRole || !isInternalRole(actorRole)) {
    return { success: false, error: "Only the Bright.Blue team can snooze tasks." };
  }

  const untilDate = new Date(until);
  if (Number.isNaN(untilDate.getTime())) {
    return { success: false, error: "Invalid snooze time." };
  }
  if (untilDate.getTime() <= Date.now()) {
    return { success: false, error: "Snooze time must be in the future." };
  }

  const snoozedUntil = untilDate.toISOString();

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ snoozed_until: snoozedUntil })
    .eq("id", taskId)
    .eq("task_type", "internal_action")
    .not("status", "in", '("complete","skipped")')
    .select("id, event_id, title")
    .single();

  if (error || !task) {
    return { success: false, error: "Could not snooze that task." };
  }

  await supabase.from("audit_entries").insert({
    event_id: task.event_id,
    actor_id: user.id,
    action: "task_snoozed",
    entity_type: "task",
    entity_id: taskId,
    metadata: { title: task.title, snoozedUntil, actorRole },
  });

  revalidatePath(`/events/${task.event_id}/actions`);
  revalidatePath("/inbox");
  revalidatePath("/");
  return { success: true, data: { snoozedUntil } };
}
