/** Operations archetypes: invoicing, compliance, deadlines, exports, countdowns. */

import { TWENTY_FOUR, SEVENTY_TWO } from "./cadence";
import type { ArchetypeSection } from "./types";

export const operationsArchetypes = {
  // Invoicing
  "invoice.overdue": {
    kind: "invoice.overdue",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Invoice {invoiceNumber} is overdue",
    bodyTemplate:
      "Invoice {invoiceNumber} for {eventName} was due on {dueDate} and is now overdue. Follow up with the client.",
    linkTemplate: "/admin/invoices",
    ownerResolver: "event_members_internal",
    reminderCadence: {
      firstAfterHours: 0,
      intervalHours: SEVENTY_TWO,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },

  // Compliance
  "compliance.document_expiring": {
    kind: "compliance.document_expiring",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "{documentTitle} expires on {expiryDate}",
    bodyTemplate:
      "A compliance document for {eventName} is expiring soon. Upload a renewed copy to keep the event on track.",
    linkTemplate: "/events/{eventId}/compliance",
    ownerResolver: "event_members_internal",
    reminderCadence: {
      firstAfterHours: 0,
      intervalHours: SEVENTY_TWO,
      maxEscalations: 3,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "compliance.requirement_unmet": {
    kind: "compliance.requirement_unmet",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required",
    subjectTemplate: "Compliance requirement missing for {eventName}",
    bodyTemplate:
      "{documentTitle} is required by the client but hasn't been uploaded or approved yet. This blocks stage advancement.",
    linkTemplate: "/events/{eventId}/compliance",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },
  "compliance.document_uploaded": {
    kind: "compliance.document_uploaded",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "{documentTitle} uploaded for {eventName}",
    bodyTemplate:
      "A compliance document has been uploaded and needs review before the event can advance.",
    linkTemplate: "/events/{eventId}/compliance",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "digest" },
    audience: "internal",
  },

  // Live machine stock
  "machine.stock_low": {
    kind: "machine.stock_low",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required — reload",
    subjectTemplate: "{eventName}: machine stock is running low",
    bodyTemplate:
      "Roughly {stockRemaining} of {stockCapacity} units are left at {eventName}. Plan a reload before the machine runs dry.",
    linkTemplate: "/events/{eventId}/live",
    ownerResolver: "event_operations_lead",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },

  // Deadline escalation
  "deadline.escalation": {
    kind: "deadline.escalation",
    classOf: "action_required",
    priority: "high",
    eyebrow: "Action required — deadline",
    subjectTemplate: "{taskTitle} is {daysOverdue} days overdue",
    bodyTemplate:
      "This item was due {dueDate} and is now blocking progress on {eventName}. Please take action or update the timeline.",
    linkTemplate: "/events/{eventId}/actions",
    ownerResolver: "task_assignee",
    reminderCadence: {
      firstAfterHours: 0,
      intervalHours: TWENTY_FOUR,
      maxEscalations: 4,
      ccAccountManagerAtLevel: 2,
    },
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "both",
  },

  // Reporting
  "report.scheduled_export_ready": {
    kind: "report.scheduled_export_ready",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "Report ready",
    subjectTemplate: "Your scheduled export for {eventName} is ready",
    bodyTemplate:
      "The report \"{filename}\" has been generated and is ready for download. The link expires in 7 days.",
    linkTemplate: "/events/{eventId}/reports",
    ownerResolver: "event_members_internal",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "internal",
  },

  // Time-driven (PR 3 cron)
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
  "event.post_wrap_rebook": {
    kind: "event.post_wrap_rebook",
    classOf: "fyi",
    priority: "normal",
    eyebrow: "FYI",
    subjectTemplate: "Ready for your next one?",
    bodyTemplate:
      "It's been a couple of weeks since {eventName} wrapped. Your results are still live in the portal — worth a look when you start planning the next activation.",
    linkTemplate: "/events/{eventId}/reports",
    ownerResolver: "customer_admins",
    defaults: { inPortal: true, emailMode: "immediate" },
    audience: "customer",
  },
} satisfies ArchetypeSection;
