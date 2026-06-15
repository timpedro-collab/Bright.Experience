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
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { bumpStreak } from "./streak";
import type { ActionResult } from "@/types/actions";

/** Mark a task as complete — clears blocking gates when applicable. */
export async function completeTask(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

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
    metadata: { title: task.title },
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
  return { success: true, data: undefined };
}

/** Skip a task (internal only) — records reason for audit trail. */
export async function skipTask(taskId: string, reason?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

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
  return { success: true, data: undefined };
}

/**
 * Auto-complete all open tasks whose `target_path` matches, using the
 * service-role client so it works from any server action context.
 */
export async function autoCompleteTaskByPath(
  eventId: string,
  targetPath: string
): Promise<void> {
  const admin = getServiceRoleClient();
  const now = new Date().toISOString();

  const { data: tasks } = await admin
    .from("tasks")
    .select("id")
    .eq("event_id", eventId)
    .eq("target_path", targetPath)
    .not("status", "in", '("complete","skipped")');

  if (!tasks || tasks.length === 0) return;

  await admin
    .from("tasks")
    .update({ status: "complete", completed_at: now })
    .in(
      "id",
      tasks.map((t: { id: string }) => t.id)
    );

  revalidatePath(`/events/${eventId}/actions`);
  revalidatePath(`/events/${eventId}`);
}
