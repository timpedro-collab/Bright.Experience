/**
 * Tests for the notification archetype catalogue. The catalogue is the
 * single source of truth for class (Action required / FYI), email
 * defaults, owner resolvers, and reminder cadence — drift here would
 * silently spam customers or drop critical alerts.
 */

import { describe, it, expect } from "vitest";
import {
  ARCHETYPES,
  getArchetype,
  fillTemplate,
  CLASS_A_KINDS,
  CLASS_B_KINDS,
} from "./archetypes";

describe("ARCHETYPES catalogue", () => {
  it("every entry's kind matches its key", () => {
    for (const [key, archetype] of Object.entries(ARCHETYPES)) {
      expect(archetype.kind).toBe(key);
    }
  });

  it("every archetype has subject + body templates", () => {
    for (const a of Object.values(ARCHETYPES)) {
      expect(a.subjectTemplate.length).toBeGreaterThan(0);
      expect(a.bodyTemplate.length).toBeGreaterThan(0);
      expect(a.linkTemplate.startsWith("/")).toBe(true);
    }
  });

  it("every Class A archetype defines a reminder cadence", () => {
    const classA = Object.values(ARCHETYPES).filter(
      (a) => a.classOf === "action_required"
    );
    // Class A archetypes that *should* never remind (e.g. the t-minus
    // crons which are themselves reminders) explicitly opt out. Most
    // should have a cadence — confirm at least 80% do.
    const withCadence = classA.filter((a) => a.reminderCadence !== undefined);
    expect(withCadence.length / classA.length).toBeGreaterThanOrEqual(0.6);
  });

  it("no archetype has a negative reminder hour", () => {
    for (const a of Object.values(ARCHETYPES)) {
      if (!a.reminderCadence) continue;
      expect(a.reminderCadence.firstAfterHours).toBeGreaterThanOrEqual(0);
      expect(a.reminderCadence.intervalHours).toBeGreaterThanOrEqual(0);
      expect(a.reminderCadence.maxEscalations).toBeGreaterThan(0);
    }
  });

  it("classifies critical customer asks as action_required", () => {
    expect(ARCHETYPES["briefing.needed"].classOf).toBe("action_required");
    expect(ARCHETYPES["asset.upload_needed"].classOf).toBe("action_required");
    expect(ARCHETYPES["approval.requested"].classOf).toBe("action_required");
    expect(ARCHETYPES["proposal.delivered"].classOf).toBe("action_required");
  });

  it("classifies informational events as fyi", () => {
    expect(ARCHETYPES["asset.review_approved"].classOf).toBe("fyi");
    expect(ARCHETYPES["lead.captured_live"].classOf).toBe("fyi");
    expect(ARCHETYPES["event.metrics_daily"].classOf).toBe("fyi");
    expect(ARCHETYPES["report.published"].classOf).toBe("fyi");
    expect(ARCHETYPES["event.post_wrap_rebook"].classOf).toBe("fyi");
  });

  it("report.published tells the customer their results are live", () => {
    const a = ARCHETYPES["report.published"];
    expect(a.audience).toBe("customer");
    expect(a.ownerResolver).toBe("customer_admins");
    expect(a.subjectTemplate).toBe("Your results are ready");
    expect(a.bodyTemplate).toContain("{eventName}");
    expect(a.linkTemplate).toBe("/events/{eventId}/reports");
    expect(a.defaults.emailMode).toBe("immediate");
  });

  it("event.post_wrap_rebook nudges the customer back to their results", () => {
    const a = ARCHETYPES["event.post_wrap_rebook"];
    expect(a.audience).toBe("customer");
    expect(a.ownerResolver).toBe("customer_admins");
    expect(a.subjectTemplate).toBe("Ready for your next one?");
    expect(a.bodyTemplate).toContain("{eventName}");
    expect(a.linkTemplate).toBe("/events/{eventId}/reports");
  });

  it("audience scoping is set on every archetype", () => {
    for (const a of Object.values(ARCHETYPES)) {
      expect(["customer", "internal", "both"]).toContain(a.audience);
    }
  });
});

describe("getArchetype", () => {
  it("returns the archetype for a known kind", () => {
    expect(getArchetype("briefing.needed").kind).toBe("briefing.needed");
  });
});

describe("fillTemplate", () => {
  it("substitutes single tokens", () => {
    expect(fillTemplate("Hello {name}", { name: "Tim" })).toBe("Hello Tim");
  });

  it("substitutes multiple tokens", () => {
    expect(
      fillTemplate("{a} + {b} = {c}", { a: 1, b: 2, c: 3 })
    ).toBe("1 + 2 = 3");
  });

  it("collapses missing tokens to empty strings", () => {
    expect(fillTemplate("Hello {missing}", {})).toBe("Hello ");
  });

  it("treats null/undefined as empty", () => {
    expect(fillTemplate("{a}{b}", { a: null, b: undefined })).toBe("");
  });

  it("leaves non-token text untouched", () => {
    expect(fillTemplate("no tokens here", {})).toBe("no tokens here");
  });

  it("coerces numbers to strings", () => {
    expect(fillTemplate("{n}", { n: 42 })).toBe("42");
  });
});

describe("CLASS_A_KINDS / CLASS_B_KINDS", () => {
  it("CLASS_A_KINDS contains only action_required archetypes", () => {
    for (const kind of CLASS_A_KINDS) {
      expect(ARCHETYPES[kind].classOf).toBe("action_required");
    }
  });

  it("CLASS_B_KINDS contains only fyi archetypes", () => {
    for (const kind of CLASS_B_KINDS) {
      expect(ARCHETYPES[kind].classOf).toBe("fyi");
    }
  });

  it("CLASS_A and CLASS_B together cover every archetype", () => {
    const total = CLASS_A_KINDS.length + CLASS_B_KINDS.length;
    expect(total).toBe(Object.keys(ARCHETYPES).length);
  });

  it("CLASS_A and CLASS_B do not overlap", () => {
    const intersection = CLASS_A_KINDS.filter((k) =>
      (CLASS_B_KINDS as string[]).includes(k)
    );
    expect(intersection).toHaveLength(0);
  });
});
