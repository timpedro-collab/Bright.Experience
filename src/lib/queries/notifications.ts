/** Supabase queries for notification management */

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, paginateQuery, totalPages } from "@/lib/pagination";
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

/** Paginated notifications for the inbox view. */
export async function getNotificationsByUserPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = PAGE_SIZE
): Promise<{ data: Notification[]; totalCount: number; totalPages: number }> {
  const supabase = await createClient();
  const query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data, error, count } = await paginateQuery(query, page, pageSize);
  if (error || !data) return { data: [], totalCount: 0, totalPages: 1 };

  const total = count ?? 0;
  return {
    data: data.map((row) => mapNotification(row as Record<string, unknown>)),
    totalCount: total,
    totalPages: totalPages(total, pageSize),
  };
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

/** Mark a single notification as read. Returns true on success, false on error. */
export async function markNotificationRead(
  notificationId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  return !error;
}

/** Mark all notifications as read for a user. Returns true on success, false on error. */
export async function markAllNotificationsRead(
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return !error;
}

export type NotificationEmailMode = "immediate" | "digest" | "off";

export interface NotificationPreferenceRow {
  kind: string;
  inPortal: boolean;
  emailMode: NotificationEmailMode;
}

export interface NotificationTimingRow {
  timezone: string | null;
  digestHour: number | null;
  quietStartHour: number | null;
  quietEndHour: number | null;
}

/** Per-kind preference rows for the settings form. */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferenceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("kind, in_portal, email_mode")
    .eq("user_id", userId);

  if (error || !data) return [];
  return data.map((row) => ({
    kind: row.kind as string,
    inPortal: Boolean(row.in_portal),
    emailMode: row.email_mode as NotificationEmailMode,
  }));
}

/** Digest / quiet-hours settings for a user (null when never configured). */
export async function getNotificationUserSettings(
  userId: string,
): Promise<NotificationTimingRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_user_settings")
    .select("timezone, digest_hour, quiet_start_hour, quiet_end_hour")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    timezone: (data.timezone as string) ?? null,
    digestHour: (data.digest_hour as number) ?? null,
    quietStartHour: (data.quiet_start_hour as number) ?? null,
    quietEndHour: (data.quiet_end_hour as number) ?? null,
  };
}
