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
 * Mark the current user's message notifications for one event as read.
 *
 * Fired when they open the event's Messages thread, so the unread badge on
 * the Messages tab (and the bell count) clears once they've actually seen
 * the thread.
 */
export async function markEventMessagesRead(
  eventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("is_read", false)
    .in("kind", ["message.received", "message.internal_note"]);

  if (error)
    return { success: false, error: `Failed to mark read: ${error.message}` };
  revalidatePath(`/events/${eventId}/communications`);
  return { success: true, data: undefined };
}

/**
 * Save the current user's digest delivery timing (timezone + quiet hours).
 *
 * Backs the controls on /settings/notifications. The hourly digest cron reads
 * these values to send each recipient their digest at their own local time.
 */
export async function updateNotificationTiming(input: {
  timezone: string;
  digestHour: number;
  quietStartHour: number;
  quietEndHour: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const validHour = (h: number) =>
    Number.isInteger(h) && h >= 0 && h <= 23 ? h : null;
  const digestHour = validHour(input.digestHour);
  const quietStartHour = validHour(input.quietStartHour);
  const quietEndHour = validHour(input.quietEndHour);
  if (digestHour === null || quietStartHour === null || quietEndHour === null) {
    return { success: false, error: "Hours must be between 0 and 23" };
  }

  try {
    // Throws RangeError for an unknown IANA zone.
    new Intl.DateTimeFormat("en-US", { timeZone: input.timezone });
  } catch {
    return { success: false, error: "Unknown timezone" };
  }

  const { error } = await supabase.from("notification_user_settings").upsert(
    {
      user_id: user.id,
      timezone: input.timezone,
      digest_hour: digestHour,
      quiet_start_hour: quietStartHour,
      quiet_end_hour: quietEndHour,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { success: false, error: `Failed to save timing: ${error.message}` };
  }
  revalidatePath("/settings/notifications");
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
