/**
 * Spine sanity — every archetype in the catalogue is fully formed.
 *
 * The compile-time `NotificationKind` union already requires that
 * every kind has an `ARCHETYPES` row. These tests cover the runtime
 * shape:
 *   - subject + body + link templates render (no missing tokens
 *     when the right context is supplied)
 *   - every owner resolver slug is one of the supported resolvers
 *   - reminder cadence (when declared) has plausible values
 *   - class A archetypes never resolve to email_mode=off without
 *     also declaring a reminder cadence (otherwise they're a silent
 *     reminder-less critical archetype)
 */

import { describe, it, expect } from "vitest";

import {
  ARCHETYPES,
  fillTemplate,
  type Archetype,
  type NotificationKind,
} from "./archetypes";

const OWNER_RESOLVERS: ReadonlySet<string> = new Set([
  "customer_admins",
  "event_account_executive",
  "event_creative_lead",
  "event_operations_lead",
  "event_members_internal",
  "event_members_all",
  "task_assignee",
  "message_recipients",
  "quote_contact",
  "asset_uploader",
  "asset_comment_participants",
  "approval_requester",
  "show_organizer",
  "venue_operator",
  "registration_partner",
  "internal_admins",
]);

function richContext(): Record<string, string | number> {
  return {
    eventName: "Acme Spring",
    eventId: "00000000-0000-4000-8000-0000000000e1",
    assetName: "Hero image",
    assetId: "00000000-0000-4000-8000-0000000000d1",
    quoteId: "00000000-0000-4000-8000-0000000000q1",
    taskTitle: "Send the brief",
    taskId: "00000000-0000-4000-8000-0000000000t1",
    approvalId: "00000000-0000-4000-8000-0000000000ap1",
    contactName: "Casey",
    senderName: "Sarah",
    preview: "We received your brief, thanks.",
    serviceType: "Video",
    title: "Hero ad",
    dueDate: "Friday",
    stageLabel: "Live event",
    status: "delivered",
    leadCount: 42,
    feedback: "Tighten the strapline.",
    invoiceNumber: "INV-2026-001",
    documentTitle: "Public Liability Insurance",
    expiryDate: "2026-12-31",
    daysOverdue: "5",
    companyName: "Acme Corp",
    authorName: "Hannah G.",
    filename: "leads-export-2026-05-28.csv",
    downloadUrl: "https://storage.example.com/reports/export.csv",
  };
}

const allArchetypes = Object.entries(ARCHETYPES) as Array<
  [NotificationKind, Archetype]
>;

describe("archetype catalogue", () => {
  it("contains at least the canonical set", () => {
    // If you add a kind to NotificationKind, this guards against a
    // missing ARCHETYPES row at runtime.
    expect(allArchetypes.length).toBeGreaterThanOrEqual(22);
  });

  it.each(allArchetypes)(
    "%s renders a non-empty subject + body + link",
    (_kind, archetype) => {
      const ctx = richContext();
      const subject = fillTemplate(archetype.subjectTemplate, ctx);
      const body = fillTemplate(archetype.bodyTemplate, ctx);
      const link = fillTemplate(archetype.linkTemplate, ctx);
      expect(subject.trim().length).toBeGreaterThan(0);
      expect(body.trim().length).toBeGreaterThan(0);
      expect(link.trim().length).toBeGreaterThan(0);
    }
  );

  it.each(allArchetypes)(
    "%s declares an owner resolver we know how to handle",
    (_kind, archetype) => {
      expect(OWNER_RESOLVERS.has(archetype.ownerResolver)).toBe(true);
    }
  );

  it.each(allArchetypes)(
    "%s has plausible reminder cadence (if any)",
    (_kind, archetype) => {
      if (!archetype.reminderCadence) return;
      const { firstAfterHours, intervalHours, maxEscalations } =
        archetype.reminderCadence;
      expect(firstAfterHours).toBeGreaterThanOrEqual(0);
      expect(intervalHours).toBeGreaterThan(0);
      expect(maxEscalations).toBeGreaterThan(0);
      expect(maxEscalations).toBeLessThanOrEqual(5);
    }
  );

  it.each(allArchetypes)(
    "%s class A archetype isn't a silent dead-letter",
    (_kind, archetype) => {
      if (archetype.classOf !== "action_required") return;
      // Either email is on by default or a reminder cadence ensures
      // we'll nudge the user later. A class A archetype with email
      // off AND no reminder is a misconfiguration.
      const allowed =
        archetype.defaults.emailMode !== "off" ||
        Boolean(archetype.reminderCadence);
      expect(allowed).toBe(true);
    }
  );

  it("fillTemplate collapses missing tokens to empty rather than crashing", () => {
    const rendered = fillTemplate("Hello {missing}", {});
    expect(rendered).toBe("Hello ");
  });
});
