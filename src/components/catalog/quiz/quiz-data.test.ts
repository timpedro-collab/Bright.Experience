/** Tests for quiz data helpers — URL-seeded answer validation. */
import { describe, expect, it } from "vitest";

import { isQuizEventType } from "./quiz-data";

describe("isQuizEventType", () => {
  it("accepts every event type the quiz itself offers", () => {
    for (const value of [
      "trade-show",
      "exhibition",
      "experiential-activation",
      "festival",
      "corporate",
      "conference",
    ]) {
      expect(isQuizEventType(value)).toBe(true);
    }
  });

  it("rejects values that are not quiz event types", () => {
    expect(isQuizEventType("retail")).toBe(false);
    expect(isQuizEventType("DROP TABLE events")).toBe(false);
  });

  it("rejects null, undefined and empty strings", () => {
    expect(isQuizEventType(null)).toBe(false);
    expect(isQuizEventType(undefined)).toBe(false);
    expect(isQuizEventType("")).toBe(false);
  });
});
