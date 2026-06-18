/** Communications & activity: notifications, messages, and the audit log. */

/**
 * Discriminated union of legacy notification trigger types.
 *
 * Retained for backwards compatibility with rows written before the
 * unified spine landed. New code should reference
 * `NotificationKind` from `@/lib/notifications/archetypes`, which is the
 * canonical vocabulary. The `type` column in the DB stays free-text so
 * both can coexist during the migration.
 */
export type NotificationType =
  | "stage_change"
  | "approval_decision"
  | "asset_uploaded"
  | "deadline_approaching"
  | "message_received"
  | "studio_update"
  | (string & {});

/** An in-app notification delivered to a specific user */
export interface Notification {
  id: string;
  userId: string;
  eventId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  /** Canonical archetype slug — see `@/lib/notifications/archetypes`. */
  kind?: string | null;
  priority?: "low" | "normal" | "high";
  actionRequired?: boolean;
  entityType?: string | null;
  entityId?: string | null;
}

/** A message in the per-event messaging thread */
export interface Message {
  id: string;
  eventId: string;
  senderId: string;
  senderName?: string;
  body: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  eventId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
