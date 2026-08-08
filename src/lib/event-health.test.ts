/** Tests for derived event health — chips computed from dates + task lateness. */
import { describe, it, expect } from "vitest";
import { deriveEventHealth, isEventWrapped } from "./event-health";
import type { EventHealthInput } from "./event-health";

const NOW = new Date("2026-08-07T12:00:00Z");

function input(overrides: Partial<EventHealthInput> = {}): EventHealthInput {
  return {
    healthStatus: "green",
    currentStage: "build_configuration",
    eventDateStart: "2026-09-01",
    eventDateEnd: "2026-09-03",
    now: NOW,
    ...overrides,
  };
}

describe("deriveEventHealth", () => {
  it("keeps a healthy future event on track", () => {
    expect(deriveEventHealth(input())).toEqual({
      kind: "health",
      status: "green",
    });
  });

  it("replaces health with a wrapped chip once the event reaches reporting", () => {
    expect(deriveEventHealth(input({ currentStage: "reporting" }))).toEqual({
      kind: "wrapped",
    });
    expect(deriveEventHealth(input({ currentStage: "complete" }))).toEqual({
      kind: "wrapped",
    });
  });

  it("goes red when the event date passed without reaching wrap", () => {
    expect(
      deriveEventHealth(
        input({
          currentStage: "kickoff_complete",
          eventDateStart: "2026-06-10",
          eventDateEnd: "2026-06-11",
        }),
      ),
    ).toEqual({ kind: "health", status: "red" });
  });

  it("stays live (not red) through the last day of a running event", () => {
    expect(
      deriveEventHealth(
        input({
          currentStage: "event_live",
          eventDateStart: "2026-08-06",
          eventDateEnd: "2026-08-07",
        }),
      ),
    ).toEqual({ kind: "health", status: "green" });
  });

  it("dents green to amber on the first overdue task", () => {
    expect(deriveEventHealth(input({ overdueTaskCount: 1 }))).toEqual({
      kind: "health",
      status: "amber",
    });
  });

  it("goes red when overdue tasks pile up", () => {
    expect(deriveEventHealth(input({ overdueTaskCount: 3 }))).toEqual({
      kind: "health",
      status: "red",
    });
  });

  it("never upgrades a manual red flag", () => {
    expect(
      deriveEventHealth(input({ healthStatus: "red", overdueTaskCount: 0 })),
    ).toEqual({ kind: "health", status: "red" });
  });

  it("uses the start date as the end when no end date exists", () => {
    expect(
      deriveEventHealth(
        input({ eventDateStart: "2026-08-01", eventDateEnd: null }),
      ),
    ).toEqual({ kind: "health", status: "red" });
  });
});

describe("isEventWrapped", () => {
  it("is true only for post-live stages", () => {
    expect(isEventWrapped({ currentStage: "reporting" })).toBe(true);
    expect(isEventWrapped({ currentStage: "complete" })).toBe(true);
    expect(isEventWrapped({ currentStage: "event_live" })).toBe(false);
    expect(isEventWrapped({ currentStage: "confirmed" })).toBe(false);
  });
});
