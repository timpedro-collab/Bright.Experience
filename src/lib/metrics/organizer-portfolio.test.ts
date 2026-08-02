/** Tests for the organizer portfolio roll-up. */
import { describe, it, expect } from "vitest";

import {
  buildShowSummary,
  emptyShowSummary,
  portfolioTotals,
  showRunState,
} from "./organizer-portfolio";

const NOW = new Date("2026-07-27T12:00:00Z").getTime();
const FRESH = "2026-07-27T11:58:00Z";
const STALE = "2026-07-27T11:40:00Z";

describe("buildShowSummary", () => {
  it("counts named zones without inventing one for unzoned units", () => {
    const summary = buildShowSummary({
      machines: [
        { zone: "Registration", mission: "welcome_gift" },
        { zone: "Registration", mission: "welcome_gift" },
        { zone: "  ", mission: "sampling" },
      ],
      slots: [],
      telemetry: [],
      now: NOW,
    });

    expect(summary.machines).toBe(3);
    expect(summary.zones).toBe(1);
  });

  it("flags a unit missing either a zone or a mission as needing setup", () => {
    const summary = buildShowSummary({
      machines: [
        { zone: "Hall 1", mission: "lead_capture" },
        { zone: null, mission: "lead_capture" },
        { zone: "Hall 2", mission: null },
      ],
      slots: [],
      telemetry: [],
      now: NOW,
    });

    expect(summary.needsSetup).toBe(2);
  });

  it("treats a machine that missed its heartbeat window as offline", () => {
    const summary = buildShowSummary({
      machines: [
        { zone: "Hall 1", mission: "lead_capture", last_heartbeat: FRESH },
        { zone: "Hall 2", mission: "lead_capture", last_heartbeat: STALE },
        { zone: "Hall 3", mission: "lead_capture", last_heartbeat: null },
      ],
      slots: [],
      telemetry: [],
      now: NOW,
    });

    expect(summary.online).toBe(1);
  });

  it("splits slot value into sold and still-available", () => {
    const summary = buildShowSummary({
      machines: [],
      slots: [
        { status: "sold", price: 1800000 },
        { status: "live", price: 1600000 },
        { status: "available", price: 1200000 },
      ],
      telemetry: [],
      now: NOW,
    });

    expect(summary.slots).toBe(3);
    expect(summary.slotsSold).toBe(2);
    expect(summary.soldValue).toBe(3400000);
    expect(summary.openValue).toBe(1200000);
  });

  it("counts plays and leads from today's telemetry and ignores the rest", () => {
    const summary = buildShowSummary({
      machines: [],
      slots: [],
      telemetry: [
        { event_type: "play_started" },
        { event_type: "play_completed" },
        { event_type: "lead_captured" },
        { event_type: "prize_awarded" },
        { event_type: "heartbeat" },
      ],
      now: NOW,
    });

    expect(summary.playsToday).toBe(2);
    expect(summary.leadsToday).toBe(1);
  });

  it("returns zeroes for a show with nothing against it", () => {
    expect(emptyShowSummary()).toEqual({
      machines: 0,
      zones: 0,
      needsSetup: 0,
      online: 0,
      slots: 0,
      slotsSold: 0,
      soldValue: 0,
      openValue: 0,
      playsToday: 0,
      leadsToday: 0,
    });
  });
});

describe("showRunState", () => {
  const today = new Date("2026-07-27T09:00:00Z");

  it("counts the opening and closing days as running", () => {
    expect(showRunState("2026-07-27", "2026-07-29", today)).toBe("running");
    expect(showRunState("2026-07-25", "2026-07-27", today)).toBe("running");
  });

  it("treats a single-day show on today as running", () => {
    expect(showRunState("2026-07-27", null, today)).toBe("running");
  });

  it("reads a show that hasn't opened as upcoming", () => {
    expect(showRunState("2026-12-13", "2026-12-14", today)).toBe("upcoming");
  });

  it("reads a show that has closed as finished", () => {
    expect(showRunState("2026-06-01", "2026-06-03", today)).toBe("finished");
  });

  it("ignores the time portion of a timestamp", () => {
    expect(showRunState("2026-07-27T23:00:00Z", null, today)).toBe("running");
  });
});

describe("portfolioTotals", () => {
  it("adds each show's numbers into one header row", () => {
    const a = buildShowSummary({
      machines: [{ zone: "Hall 1", mission: "lead_capture", last_heartbeat: FRESH }],
      slots: [{ status: "sold", price: 1000 }],
      telemetry: [{ event_type: "play_started" }],
      now: NOW,
    });
    const b = buildShowSummary({
      machines: [{ zone: null, mission: null }],
      slots: [{ status: "available", price: 500 }],
      telemetry: [{ event_type: "lead_captured" }],
      now: NOW,
    });

    expect(portfolioTotals([a, b])).toEqual({
      shows: 2,
      machines: 2,
      needsSetup: 1,
      online: 1,
      soldValue: 1000,
      openValue: 500,
      slots: 2,
      playsToday: 1,
      leadsToday: 1,
    });
  });

  it("returns an all-zero header for an organizer with no shows", () => {
    expect(portfolioTotals([]).shows).toBe(0);
    expect(portfolioTotals([]).machines).toBe(0);
  });
});
