/** System-lifecycle + FYI archetypes: provisioning, reports, live signals. */

import type { ArchetypeSection } from "./types";

export const lifecycleArchetypes = {
  // System lifecycle
  "booking.provisioned": {
    kind: "booking.provisioned",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "Event provisioned for {companyName}",
    bodyTemplate:
      "A new event has been automatically created from an accepted quote. The customer has been invited to the portal.",
    linkTemplate: "/events/{eventId}",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "report.draft_ready": {
    kind: "report.draft_ready",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Draft report ready for {eventName}",
    bodyTemplate:
      "A post-event report has been auto-generated for {eventName}. Review the metrics and publish when you're happy.",
    linkTemplate: "/events/{eventId}/reports",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },

  // FYI
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
  "comment.new": {
    kind: "comment.new",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "{authorName} commented on {assetName}",
    bodyTemplate: "{preview}",
    linkTemplate: "/events/{eventId}/assets",
    ownerResolver: "asset_comment_participants",
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
} satisfies ArchetypeSection;
