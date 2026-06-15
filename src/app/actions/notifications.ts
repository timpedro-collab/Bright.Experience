"use server";

/**
 * Server actions for notification management.
 *
 * Read-state mutations for the in-app notification bell. New code
 * should dispatch via `@/lib/notifications/dispatch` — these actions
 * handle only read/unread toggling and legacy ad-hoc creation.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

/** Mark a single notification as read. */
export async function markRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: `Failed to mark read: ${error.message}` };
  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

/** Mark all notifications for the current user as read. */
export async function markAllRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, error: `Failed to mark all read: ${error.message}` };
  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

/**
 * Create a single ad-hoc notification row.
 *
 * **Prefer `dispatchNotification` from `@/lib/notifications/dispatch` for
 * any new code.** This function is retained for the handful of legacy
 * spots that hand-craft a notification (e.g. one-off internal pings).
 */
export async function createNotification(
  userId: string,
  eventId: string | null,
  type: string,
  title: string,
  body: string | null,
  link: string | null
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    event_id: eventId,
    type,
    title,
    body,
    link,
    is_read: false,
  });

  if (error) return { success: false, error: `Failed to create notification: ${error.message}` };
  return { success: true, data: undefined };
}
