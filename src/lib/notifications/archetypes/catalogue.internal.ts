/** Internal-actionable archetypes: intake, bookings, reviews, studio, tasks. */

import { TWENTY_FOUR, FORTY_EIGHT } from "./cadence";
import type { ArchetypeSection } from "./types";

export const internalArchetypes = {
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
  "proposal.walkthrough_booked": {
    kind: "proposal.walkthrough_booked",
    classOf: "fyi",
    priority: "high",
    eyebrow: "FYI",
    subjectTemplate: "Walkthrough booked — {slotLabel}",
    bodyTemplate:
      "The customer booked their 15-minute proposal walkthrough for {slotLabel}. Prep the tailored proposal before the call.",
    linkTemplate: "/admin/quotes/{quoteId}",
    ownerResolver: "event_account_executive",
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
    roleScope: ["creative_lead", "events_lead", "admin"],
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
    roleScope: ["creative_lead", "events_lead", "admin"],
  },
  /**
   * A sponsor said yes on their private pitch link. Goes to the organizer
   * running the show — they own the sponsor relationship — with the show's
   * internal owner copied in.
   */
  "sponsor.interest_received": {
    kind: "sponsor.interest_received",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{sponsorName} wants the slot on {eventName}",
    bodyTemplate:
      "{sponsorName} responded to the pitch for {eventName}. Contact: {contactName} ({contactEmail}). Confirm the slot to hold it for them.",
    linkTemplate: "/organizers/{organizerSlug}/sponsors",
    ownerResolver: "show_organizer",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    // The organizer is a partner role and the show owner is internal, so
    // neither side of the audience filter may drop the other.
    audience: "both",
    roleScope: ["partner_admin", "partner_member", "events_lead", "admin"],
  },
  /**
   * An organizer registered a sponsor conversation. Bright.Blue reviews
   * within a 24-hour SLA — approval grants the organizer a 14-day
   * exclusivity window on that sponsor, so a slow review stalls their sale.
   */
  "deal.registered": {
    kind: "deal.registered",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Deal registered — {sponsorCompany} by {partnerName}",
    bodyTemplate:
      "{partnerName} registered {sponsorCompany} as their sponsor prospect. Review within 24 hours — approval locks the deal to them for 14 days.",
    linkTemplate: "/admin/deals",
    ownerResolver: "internal_admins",
    reminderCadence: {
      firstAfterHours: 12,
      intervalHours: 12,
      maxEscalations: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  /**
   * Bright.Blue approved a registration — the organizer now owns that
   * sponsor conversation for 14 days across every channel.
   */
  "deal.approved": {
    kind: "deal.approved",
    classOf: "fyi",
    priority: "high",
    eyebrow: "FYI",
    subjectTemplate: "{sponsorCompany} is registered to you",
    bodyTemplate:
      "Your registration for {sponsorCompany} is approved. The deal is exclusively yours for the next 14 days — go close it.",
    linkTemplate: "/organizers/{organizerSlug}/deals",
    ownerResolver: "registration_partner",
    defaults: { inPortal: true, emailMode: "immediate" },
    // Recipients are partner-role users; internal filter must not drop them.
    audience: "both",
    roleScope: ["partner_admin", "partner_member"],
  },
  "deal.rejected": {
    kind: "deal.rejected",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "Registration for {sponsorCompany} was not approved",
    bodyTemplate:
      "Your registration for {sponsorCompany} was declined: {reason}. Reply to this thread if you think we got it wrong.",
    linkTemplate: "/organizers/{organizerSlug}/deals",
    ownerResolver: "registration_partner",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
    roleScope: ["partner_admin", "partner_member"],
  },
  /**
   * Reverse registration: an inbound brand lead matched an organizer's show,
   * so Bright.Blue pushed it to them as a pre-filled deal shell.
   */
  "deal.lead_pushed": {
    kind: "deal.lead_pushed",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "We've matched a sponsor lead to you — {sponsorCompany}",
    bodyTemplate:
      "{sponsorCompany} came to Bright.Blue directly and fits your show. The deal is pre-registered to you — pick it up and make contact.",
    linkTemplate: "/organizers/{organizerSlug}/deals",
    ownerResolver: "registration_partner",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
    roleScope: ["partner_admin", "partner_member"],
  },
  /**
   * An advertiser asked for an open slot on a venue's public page. The hold is
   * already placed; the venue operator has to confirm or release it.
   */
  "sponsor.slot_requested": {
    kind: "sponsor.slot_requested",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{sponsorName} requested a slot at {venueName}",
    bodyTemplate:
      "{sponsorName} requested {slotDates} at {venueName}. Contact: {contactName} ({contactEmail}). The slot is on hold until you confirm or release it.",
    linkTemplate: "/venues/{venueSlug}/sponsorships",
    ownerResolver: "venue_operator",
    reminderCadence: {
      firstAfterHours: TWENTY_FOUR,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
    roleScope: ["partner_admin", "partner_member", "events_lead", "admin"],
  },
  /** A new partner applied through the public form and needs a decision. */
  "partner.application_received": {
    kind: "partner.application_received",
    classOf: "action_required",
    priority: "normal",
    eyebrow: "Action required",
    subjectTemplate: "New partner application — {partnerName}",
    bodyTemplate:
      "{partnerName} applied as a {partnerType} partner. Contact: {contactName} ({contactEmail}). Review and approve or decline.",
    linkTemplate: "/admin/partners",
    ownerResolver: "internal_admins",
    reminderCadence: {
      firstAfterHours: FORTY_EIGHT,
      intervalHours: FORTY_EIGHT,
      maxEscalations: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
    roleScope: ["admin", "events_lead"],
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
    audience: "internal",
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
  "task.completed": {
    kind: "task.completed",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "Progress update",
    subjectTemplate: "{taskTitle} completed",
    bodyTemplate:
      "A blocking action on {eventName} has been marked as complete. The event may now be eligible to advance to the next stage.",
    linkTemplate: "/events/{eventId}/actions",
    ownerResolver: "event_account_executive",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "internal",
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
} satisfies ArchetypeSection;
