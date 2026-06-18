/** Customer-facing archetypes: briefs, asset uploads, proofs, proposals. */

import { TWENTY_FOUR, FORTY_EIGHT, SEVENTY_TWO } from "./cadence";
import type { ArchetypeSection } from "./types";

export const customerArchetypes = {
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
} satisfies ArchetypeSection;
