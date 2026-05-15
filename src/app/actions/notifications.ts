"use server";

/** Server actions for notification management */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Mark a single notification as read */
export async function markRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw new Error(`Failed to mark read: ${error.message}`);
  revalidatePath("/", "layout");
}

/** Mark all notifications for the current user as read */
export async function markAllRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) throw new Error(`Failed to mark all read: ${error.message}`);
  revalidatePath("/", "layout");
}

/**
 * Create a single ad-hoc notification row.
 *
 * **Prefer `dispatchNotification` from `@/lib/notifications/dispatch` for
 * any new code.** This function is retained for the handful of legacy
 * spots that hand-craft a notification (e.g. one-off internal pings).
 * Every domain event with a canonical archetype goes through the
 * dispatcher instead — that way subject lines, links, reminder cadences
 * and email rendering all stay in one place.
 */
export async function createNotification(
  userId: string,
  eventId: string | null,
  type: string,
  title: string,
  body: string | null,
  link: string | null
) {
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

  if (error) throw new Error(`Failed to create notification: ${error.message}`);
}
