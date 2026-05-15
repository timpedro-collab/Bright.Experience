/** Supabase queries for notification management */

import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";

/**
 * Normalise a raw notifications row (snake_case from Postgres) into the
 * camelCase shape the React components expect. Keeps the rendering layer
 * decoupled from the DB column naming.
 */
function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    eventId: row.event_id ? String(row.event_id) : undefined,
    type: String(row.type),
    title: String(row.title),
    body: row.body ? String(row.body) : undefined,
    isRead: Boolean(row.is_read),
    link: row.link ? String(row.link) : undefined,
    createdAt: String(row.created_at),
    kind: row.kind ? String(row.kind) : null,
    priority:
      (row.priority as "low" | "normal" | "high" | undefined) ?? "normal",
    actionRequired: Boolean(row.action_required),
    entityType: row.entity_type ? String(row.entity_type) : null,
    entityId: row.entity_id ? String(row.entity_id) : null,
  };
}

/** Fetch all notifications for a user, most recent first (max 50) */
export async function getNotificationsByUser(
  userId: string
): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map((row) => mapNotification(row as Record<string, unknown>));
}

/** Count of unread notifications for a user */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

/** Mark a single notification as read */
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw new Error(`Failed to mark read: ${error.message}`);
}

/** Mark all notifications as read for a user */
export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(`Failed to mark all read: ${error.message}`);
}
