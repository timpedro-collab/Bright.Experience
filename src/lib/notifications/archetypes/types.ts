/**
 * Types for the notification archetype catalogue.
 *
 * The `NotificationKind` union is the single string vocabulary used
 * everywhere — DB columns, dispatcher arguments, preference rows. Add a kind
 * here, then add a row to the catalogue (see `./catalogue.*`); the
 * `Record<NotificationKind, Archetype>` assembled in `./index.ts` fails at
 * compile time if a kind has no matching row.
 */

import type { UserRole } from "@/types";

export type NotificationClass = "action_required" | "fyi";

export type NotificationPriority = "low" | "normal" | "high";

export type NotificationKind =
  // Customer-actionable
  | "briefing.needed"
  | "asset.upload_needed"
  | "asset.revision_requested"
  | "asset.review_approved"
  | "approval.requested"
  | "approval.approved"
  | "approval.revision_requested"
  | "proposal.delivered"
  // Internal-actionable
  | "proposal.intake_received"
  | "proposal.walkthrough_booked"
  | "booking.received"
  | "quote.accepted"
  | "asset.review_needed"
  | "briefing.submitted"
  | "studio.request_submitted"
  | "sponsor.interest_received"
  | "sponsor.slot_requested"
  | "partner.application_received"
  | "studio.status_changed"
  | "task.assigned"
  | "task.completed"
  | "task.overdue"
  | "machine.stock_low"
  // FYI
  | "lead.captured_live"
  | "event.metrics_daily"
  | "message.received"
  | "comment.new"
  | "stage.changed"
  // System lifecycle
  | "booking.provisioned"
  | "report.draft_ready"
  // Invoicing
  | "invoice.overdue"
  // Compliance
  | "compliance.document_expiring"
  | "compliance.requirement_unmet"
  | "compliance.document_uploaded"
  // Deadline escalation
  | "deadline.escalation"
  // Reporting
  | "report.scheduled_export_ready"
  // Time-driven
  | "event.t_minus_30"
  | "event.t_minus_14"
  | "event.t_minus_7"
  | "event.t_minus_3";

/** Slug pointing into `../resolve-owners.ts`. */
export type OwnerResolverKey =
  | "customer_admins"
  | "event_account_executive"
  | "event_creative_lead"
  | "event_operations_lead"
  | "event_members_internal"
  | "event_members_all"
  | "task_assignee"
  | "message_recipients"
  | "asset_uploader"
  | "asset_comment_participants"
  | "approval_requester"
  | "show_organizer"
  | "venue_operator"
  | "internal_admins";

/** Reminder cadence — when does the cron consider this archetype stale? */
export interface ReminderCadence {
  /** Hours after the subject is created/last-touched before the first nudge. */
  firstAfterHours: number;
  /** Hours between subsequent nudges. */
  intervalHours: number;
  /** Stop after this many nudges so we never spin forever. */
  maxEscalations: number;
  /** At which escalation level do we cc the AE for class-A reminders? */
  ccAccountManagerAtLevel?: number;
}

export interface Archetype {
  kind: NotificationKind;
  classOf: NotificationClass;
  priority: NotificationPriority;
  /** Eyebrow shown in the email + portal item: "Action required" / "FYI". */
  eyebrow: string;
  /**
   * Subject line + portal title. Conversational, outcome-focused. Use
   * `{placeholder}` tokens that the dispatcher fills from `context`.
   */
  subjectTemplate: string;
  /** Plain-text body used in both portal + email. Supports `{tokens}`. */
  bodyTemplate: string;
  /** Path the CTA + portal item links to. Supports `{tokens}`. */
  linkTemplate: string;
  ownerResolver: OwnerResolverKey;
  /** Optional — absent means no reminders fire for this archetype. */
  reminderCadence?: ReminderCadence;
  /**
   * Sane defaults if the user has no row in `notification_preferences`.
   * Class A archetypes still force `in_portal=true` at the application
   * layer; this is the *email* default.
   */
  defaults: {
    inPortal: boolean;
    emailMode: "immediate" | "digest" | "off";
  };
  /**
   * Hint for the audience filter — `customer` archetypes never fan out to
   * internal-only users, `internal` archetypes never fan out to customer
   * accounts even if `resolveOwners` would otherwise include them.
   */
  audience: "customer" | "internal" | "both";
  /** Optional list of roles allowed to receive — narrows past `audience`. */
  roleScope?: UserRole[];
}

/** A partial slice of the catalogue, declared by each section module. */
export type ArchetypeSection = Partial<Record<NotificationKind, Archetype>>;
