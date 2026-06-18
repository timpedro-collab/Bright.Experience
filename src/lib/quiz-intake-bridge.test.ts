/**
 * Tests for the quiz → proposal-intake taxonomy bridge. The bridge exists to
 * stop the funnel from dropping unmapped quiz values onto the intake form,
 * which used to leave step 0 blank and force the customer to re-answer.
 */

import { describe, it, expect } from "vitest";
import { bridgeQuizToIntake, INTAKE_EVENT_TYPES } from "./quiz-intake-bridge";

describe("bridgeQuizToIntake", () => {
  it("maps quiz event taxonomy onto a valid intake event type", () => {
    for (const event of [
      "trade-show",
      "exhibition",
      "experiential-activation",
      "festival",
      "corporate",
      "conference",
    ]) {
      const { eventType } = bridgeQuizToIntake({ event });
      expect(eventType).not.toBe("");
      expect(INTAKE_EVENT_TYPES).toContain(eventType as never);
    }
  });

  it("passes through values that are already canonical intake types", () => {
    expect(bridgeQuizToIntake({ event: "activation" }).eventType).toBe(
      "activation"
    );
    expect(bridgeQuizToIntake({ event: "custom" }).eventType).toBe("custom");
  });

  it("returns empty eventType for unknown values (so step 0 still shows)", () => {
    expect(bridgeQuizToIntake({ event: "nonsense" }).eventType).toBe("");
    expect(bridgeQuizToIntake({ event: null }).eventType).toBe("");
    expect(bridgeQuizToIntake({}).eventType).toBe("");
  });

  it("maps quiz objectives to a readable line", () => {
    expect(bridgeQuizToIntake({ objective: "lead-generation" }).objective).toBe(
      "Lead generation and pipeline"
    );
    expect(bridgeQuizToIntake({ objective: "sampling" }).objective).toBe(
      "Product sampling and trial"
    );
  });

  it("falls back to the raw objective string when unmapped", () => {
    expect(bridgeQuizToIntake({ objective: "win awards" }).objective).toBe(
      "win awards"
    );
    expect(bridgeQuizToIntake({ objective: "" }).objective).toBe("");
  });
});
