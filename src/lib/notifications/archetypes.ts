/**
 * Canonical notification archetypes — the dispatch table for the spine.
 *
 * Every domain event that wants to notify someone declares its archetype
 * here. The dispatcher (`./dispatch.ts`) and the reminder cron read from
 * this catalogue rather than each callsite hand-rolling its own copy. That
 * keeps subject lines, body copy, links, owner rules, and reminder cadence
 * in one place — when copy needs a polish, it changes in one file.
 *
 * Two classes of archetypes:
 *   - `action_required` (Class A): project-critical. The in-portal lane is
 *     always-on at the application layer regardless of stored preferences,
 *     and the reminder cron overrides `email_mode: "off"` after 48h.
 *   - `fyi` (Class B): informational. Both lanes are fully opt-outable per
 *     `notification_preferences`.
 *
 * Owner resolution is intentionally NOT in this file — each archetype names
 * its resolver and `./resolve-owners.ts` provides the pure function. That
 * way, the resolver can hit the database (membership lookup, AE assignment)
 * without making the archetype catalogue async.
 */

import type { UserRole } from "@/types";

export type NotificationClass = "action_required" | "fyi";

export type NotificationPriority = "low" | "normal" | "high";

/**
 * The kinds enum is the single string vocabulary used everywhere — DB
 * columns, dispatcher arguments, preference rows. Add a kind here, then
 * add a row to `ARCHETYPES` below; both checks fail at compile time if
 * you forget.
 */
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
  | "booking.received"
  | "quote.accepted"
  | "asset.review_needed"
  | "briefing.submitted"
  | "studio.request_submitted"
  | "studio.status_changed"
  | "task.assigned"
  | "task.overdue"
  // FYI
  | "lead.captured_live"
  | "event.metrics_daily"
  | "message.received"
  | "stage.changed"
  // Time-driven
  | "event.t_minus_30"
  | "event.t_minus_14"
  | "event.t_minus_7"
  | "event.t_minus_3";

/** Slug pointing into `./resolve-owners.ts`. */
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
  | "approval_requester";

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

const TWENTY_FOUR = 24;
const FORTY_EIGHT = 48;
const SEVENTY_TWO = 72;

/**
 * The catalogue. Keep alphabetised by kind within each section so reviews
 * stay diff-friendly.
 */
export const ARCHETYPES: Record<NotificationKind, Archetype> = {
  // ─────────────────────────────────────────────────────────
  // Customer-actionable
  // ─────────────────────────────────────────────────────────
  "briefing.needed": {
    kind: "briefing.needed",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Your event brief is ready to fill in",
    bodyTemplate:
      "We're ready to start building out {eventName}. The brief takes about ten minutes and unlocks the next stage of work.",
    linkTemplate: "/events/{eventId}/briefing",
    ownerResolver: "customer_admins",
    reminderCadence: {
      firstAfterHours: FORTY_EIGHT,
      intervalHours: FORTY_EIGHT,
      maxEscalations: 3,
      ccAccountManagerAtLevel: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "customer",
  },
  "asset.upload_needed": {
    kind: "asset.upload_needed",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "We need your creative to keep {eventName} on track",
    bodyTemplate:
      "There's still creative we're waiting on for {eventName}. Drop the files in the portal and we'll review within one working day.",
    linkTemplate: "/events/{eventId}/assets",
    ownerResolver: "customer_admins",
    reminderCadence: {
      firstAfterHours: SEVENTY_TWO,
      intervalHours: SEVENTY_TWO,
      maxEscalations: 3,
      ccAccountManagerAtLevel: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "customer",
  },
  "asset.revision_requested": {
    kind: "asset.revision_requested",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{assetName} needs a small revision",
    bodyTemplate:
      "Our creative team had a small note on {assetName}. Open the portal to read the specifics and re-upload.",
    linkTemplate: "/events/{eventId}/assets",
    ownerResolver: "customer_admins",
    reminderCadence: {
      firstAfterHours: FORTY_EIGHT,
      intervalHours: FORTY_EIGHT,
      maxEscalations: 3,
      ccAccountManagerAtLevel: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "customer",
  },
  "asset.review_approved": {
    kind: "asset.review_approved",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "{assetName} is approved",
    bodyTemplate:
      "Great news — {assetName} is signed off and locked in for {eventName}. Nothing more for you to do on it.",
    linkTemplate: "/events/{eventId}/assets",
    ownerResolver: "customer_admins",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "customer",
  },
  "approval.requested": {
    kind: "approval.requested",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "A proof is ready for your sign-off",
    bodyTemplate:
      "We've posted a proof for {eventName} that needs your eye. Approve when you're happy, or note what you'd like changed.",
    linkTemplate: "/events/{eventId}/approvals",
    ownerResolver: "customer_admins",
    reminderCadence: {
      firstAfterHours: FORTY_EIGHT,
      intervalHours: FORTY_EIGHT,
      maxEscalations: 3,
      ccAccountManagerAtLevel: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "customer",
  },
  "approval.approved": {
    kind: "approval.approved",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "Your approval is in — thanks",
    bodyTemplate:
      "Your sign-off on {eventName} is logged. The team's pushing the next step now.",
    linkTemplate: "/events/{eventId}/approvals",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "internal",
  },
  "approval.revision_requested": {
    kind: "approval.revision_requested",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Customer asked for a revision on a proof",
    bodyTemplate:
      "The customer requested a change on a proof for {eventName}. Open the portal to read their note and re-cut.",
    linkTemplate: "/events/{eventId}/approvals",
    ownerResolver: "event_members_internal",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "proposal.delivered": {
    kind: "proposal.delivered",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Your tailored proposal is ready to review",
    bodyTemplate:
      "Your proposal for {eventName} is live in the portal. Take a look and let us know — accept it or tell us what to adjust.",
    linkTemplate: "/proposal/{quoteId}",
    ownerResolver: "customer_admins",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR * 5,
      intervalHours: TWENTY_FOUR * 5,
      maxEscalations: 2,
      ccAccountManagerAtLevel: 1,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "customer",
  },

  // ─────────────────────────────────────────────────────────
  // Internal-actionable
  // ─────────────────────────────────────────────────────────
  "proposal.intake_received": {
    kind: "proposal.intake_received",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "New proposal intake — {contactName}",
    bodyTemplate:
      "{contactName} just submitted a proposal intake. Capabilities are pre-tagged on the quote — first response within four hours.",
    linkTemplate: "/admin/quotes/{quoteId}",
    ownerResolver: "event_account_executive",
    reminderCadence: {
      firstAfterHours: 4,
      intervalHours: 4,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "booking.received": {
    kind: "booking.received",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "New booking — {contactName}",
    bodyTemplate:
      "{contactName} just booked through the configurator. Confirm payment intent, kick off the event, and acknowledge within four hours.",
    linkTemplate: "/admin/quotes/{quoteId}",
    ownerResolver: "event_account_executive",
    reminderCadence: {
      firstAfterHours: 4,
      intervalHours: 4,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "quote.accepted": {
    kind: "quote.accepted",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Proposal accepted — kick off {eventName}",
    bodyTemplate:
      "The customer accepted the proposal. Time to spin up the event and send the brief.",
    linkTemplate: "/admin/quotes/{quoteId}",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "asset.review_needed": {
    kind: "asset.review_needed",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{assetName} needs a creative review",
    bodyTemplate:
      "{contactName} uploaded {assetName} for {eventName}. Review against the spec — approve it or send back with a note.",
    linkTemplate: "/admin/asset-reviews",
    ownerResolver: "event_creative_lead",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
    roleScope: ["creative_lead", "events_lead", "admin", "developer"],
  },
  "briefing.submitted": {
    kind: "briefing.submitted",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "{contactName} submitted the brief for {eventName}",
    bodyTemplate:
      "The brief is in. The next step is yours — read it through and queue up the production milestones.",
    linkTemplate: "/events/{eventId}/briefing",
    ownerResolver: "event_creative_lead",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "studio.request_submitted": {
    kind: "studio.request_submitted",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "New Studio order — {title}",
    bodyTemplate:
      "A new Bright.Studio order needs a producer. Service: {serviceType}. Open the portal to take it.",
    linkTemplate: "/studio",
    ownerResolver: "event_creative_lead",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
    roleScope: ["creative_lead", "events_lead", "admin", "developer"],
  },
  "studio.status_changed": {
    kind: "studio.status_changed",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "Studio update on {title}",
    bodyTemplate: "Status changed to {status}. Open the portal for the latest.",
    linkTemplate: "/events/{eventId}/studio",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "both",
  },
  "task.assigned": {
    kind: "task.assigned",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{taskTitle} is on your plate",
    bodyTemplate: "Due {dueDate}. Open the task to start it or hand it off.",
    linkTemplate: "/events/{eventId}/actions",
    ownerResolver: "task_assignee",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
  },
  "task.overdue": {
    kind: "task.overdue",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required — overdue",
    subjectTemplate: "{taskTitle} is overdue",
    bodyTemplate:
      "This task was due {dueDate}. Open it to update the status — even a quick note keeps the timeline honest.",
    linkTemplate: "/events/{eventId}/actions",
    ownerResolver: "task_assignee",
    reminderCadence: {
      firstAfterHours: 0,
      intervalHours: FORTY_EIGHT,
      maxEscalations: 3,
      ccAccountManagerAtLevel: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
  },

  // ─────────────────────────────────────────────────────────
  // FYI
  // ─────────────────────────────────────────────────────────
  "lead.captured_live": {
    kind: "lead.captured_live",
    classOf: "fyi",
    priority: "low",
    eyebrow: "FYI",
    subjectTemplate: "{eventName}: {leadCount} new leads today",
    bodyTemplate:
      "Live capture summary for {eventName}. Full breakdown in the portal.",
    linkTemplate: "/events/{eventId}/metrics",
    ownerResolver: "event_members_all",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "both",
  },
  "event.metrics_daily": {
    kind: "event.metrics_daily",
    classOf: "fyi",
    priority: "low",
    eyebrow: "FYI",
    subjectTemplate: "{eventName} daily summary",
    bodyTemplate: "Plays, leads and conversions for the last 24 hours.",
    linkTemplate: "/events/{eventId}/metrics",
    ownerResolver: "event_members_all",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "both",
  },
  "message.received": {
    kind: "message.received",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "New message from {senderName}",
    bodyTemplate: "{preview}",
    linkTemplate: "/events/{eventId}/communications",
    ownerResolver: "message_recipients",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "both",
  },
  "stage.changed": {
    kind: "stage.changed",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "{eventName} moved to {stageLabel}",
    bodyTemplate:
      "The event has advanced to the {stageLabel} stage. Take a look at what's next.",
    linkTemplate: "/events/{eventId}",
    ownerResolver: "event_members_all",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "both",
  },

  // ─────────────────────────────────────────────────────────
  // Time-driven (PR 3 cron)
  // ─────────────────────────────────────────────────────────
  "event.t_minus_30": {
    kind: "event.t_minus_30",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "{eventName} is 30 days out",
    bodyTemplate:
      "Thirty days to go. If you're missing anything we need, the portal will flag it on the dashboard.",
    linkTemplate: "/events/{eventId}",
    ownerResolver: "event_members_all",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
  },
  "event.t_minus_14": {
    kind: "event.t_minus_14",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{eventName} is two weeks away",
    bodyTemplate:
      "Two weeks to go. Anything outstanding needs to land this week — open the portal to see what's still on your plate.",
    linkTemplate: "/events/{eventId}",
    ownerResolver: "event_members_all",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
  },
  "event.t_minus_7": {
    kind: "event.t_minus_7",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{eventName} is one week out",
    bodyTemplate:
      "One week to go. The portal is showing the final checklist — anything red needs to be cleared by Friday.",
    linkTemplate: "/events/{eventId}",
    ownerResolver: "event_members_all",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
  },
  "event.t_minus_3": {
    kind: "event.t_minus_3",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Final checks",
    subjectTemplate: "{eventName} is in three days — final checks",
    bodyTemplate:
      "Last call. Open the portal and confirm everything green so we can roll on the day with confidence.",
    linkTemplate: "/events/{eventId}",
    ownerResolver: "event_members_all",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
  },
};

/** Convenience: the lookup any consumer should use. */
export function getArchetype(kind: NotificationKind): Archetype {
  return ARCHETYPES[kind];
}

/**
 * Render `{token}` placeholders using a flat context object. Missing
 * tokens collapse to empty strings — better a slightly bland email than a
 * crashed dispatch.
 */
export function fillTemplate(
  template: string,
  context: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = context[key];
    if (value === null || value === undefined) return "";
    return String(value);
  });
}

/**
 * Class A archetypes — useful for the dispatcher and the preferences UI to
 * loop over without having to filter the catalogue.
 */
export const CLASS_A_KINDS: NotificationKind[] = Object.values(ARCHETYPES)
  .filter((a) => a.classOf === "action_required")
  .map((a) => a.kind);

export const CLASS_B_KINDS: NotificationKind[] = Object.values(ARCHETYPES)
  .filter((a) => a.classOf === "fyi")
  .map((a) => a.kind);
