/**
 * Task auto-completion helpers.
 *
 * Server-only, not Server Actions. These mark tasks complete with the service
 * role for an arbitrary event id, so exporting them from a `"use server"` module
 * let anyone tick off another tenant's delivery checklist. They are called from
 * the actions that legitimately satisfy a task (briefing submitted, asset
 * uploaded, logistics saved), each of which authorises the caller first.
 */
import "server-only";

import { revalidatePath } from "next/cache";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { anyOf, ilikeContains } from "@/lib/queries/filters";

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
  revalidatePath("/inbox");
  revalidatePath("/");
}

/**
 * Auto-complete open tasks matching a `target_path` AND a title keyword.
 *
 * Some paths host more than one task (e.g. `assets` carries both "Upload
 * primary brand logo" and "Upload brand guidelines document"), so a plain
 * path match would over-complete. The keyword scopes it to the right one.
 */
export async function autoCompleteTaskByPathAndTitle(
  eventId: string,
  targetPath: string,
  titleKeywords: string[]
): Promise<void> {
  const admin = getServiceRoleClient();
  const now = new Date().toISOString();

  const orFilter = anyOf(
    ...titleKeywords.map((kw) => ilikeContains("title", kw))
  );

  const { data: tasks } = await admin
    .from("tasks")
    .select("id")
    .eq("event_id", eventId)
    .eq("target_path", targetPath)
    .or(orFilter)
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
  revalidatePath("/inbox");
  revalidatePath("/");
}
