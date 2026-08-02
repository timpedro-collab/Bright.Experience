/** Unit tests for customer-facing copy helpers. */
import { describe, it, expect } from "vitest";
import {
  stageLabelFor,
  healthLabelFor,
  customerStatusLine,
} from "./customer-copy";

/** Build a YYYY-MM-DD string exactly `n` days from today (local midnight). */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("stageLabelFor", () => {
  it("gives customers plain-English labels and internal roles the ops label", () => {
    expect(stageLabelFor("qa_readiness", true)).toBe("We're testing it");
    expect(stageLabelFor("qa_readiness", false)).not.toBe("We're testing it");
  });
});

describe("healthLabelFor", () => {
  it("never shows customers the word Blocked", () => {
    expect(healthLabelFor("red", true)).toBe("In progress");
    expect(healthLabelFor("green", true)).toBe("On track");
  });
});

describe("customerStatusLine", () => {
  it("counts down the days to a future event with venue", () => {
    expect(
      customerStatusLine({
        currentStage: "confirmed",
        eventDateStart: daysFromNow(12),
        venueName: "ExCeL London",
      }),
    ).toBe("You're booked in · Live in 12 days at ExCeL London");
  });

  it("uses the singular day and falls back to a generic venue", () => {
    expect(
      customerStatusLine({
        currentStage: "approvals",
        eventDateStart: daysFromNow(1),
      }),
    ).toBe("Ready for your approval · Live in 1 day at your venue");
  });

  it("reads as live when the event day has arrived", () => {
    expect(
      customerStatusLine({
        currentStage: "event_live",
        eventDateStart: daysFromNow(0),
        venueName: "The O2",
      }),
    ).toBe("Live now · Live today at The O2");
  });

  it("points delivered events at their results instead of a countdown", () => {
    expect(
      customerStatusLine({
        currentStage: "complete",
        eventDateStart: daysFromNow(-30),
        venueName: "ExCeL London",
      }),
    ).toBe("All wrapped · Your results are ready");
  });
});
