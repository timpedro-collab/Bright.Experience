/** Tests for the engaged-minutes metric. */
import { describe, it, expect } from "vitest";
import {
  engagedMinutes,
  formatEngagedMinutes,
  costPerEngagedMinutePence,
} from "./engaged-minutes";

describe("engagedMinutes", () => {
  it("multiplies plays by average session length in minutes", () => {
    // 1,200 plays × 45s = 54,000s = 900 minutes
    expect(engagedMinutes(1200, 45)).toBe(900);
  });

  it("rounds to whole minutes", () => {
    expect(engagedMinutes(100, 50)).toBe(83); // 5000s = 83.33min
  });

  it("returns null when plays are zero or negative", () => {
    expect(engagedMinutes(0, 45)).toBeNull();
    expect(engagedMinutes(-5, 45)).toBeNull();
  });

  it("returns null when dwell is missing or unusable", () => {
    expect(engagedMinutes(100, null)).toBeNull();
    expect(engagedMinutes(100, 0)).toBeNull();
    expect(engagedMinutes(100, Number.NaN)).toBeNull();
  });
});

describe("formatEngagedMinutes", () => {
  it("uses minutes under two hours", () => {
    expect(formatEngagedMinutes(90)).toBe("90 engaged minutes");
  });

  it("switches to hours at two hours, one decimal under ten hours", () => {
    expect(formatEngagedMinutes(126)).toBe("2.1 hours of brand attention");
    expect(formatEngagedMinutes(555)).toBe("9.3 hours of brand attention");
  });

  it("drops the decimal from ten hours up", () => {
    expect(formatEngagedMinutes(1240)).toBe("21 hours of brand attention");
    expect(formatEngagedMinutes(45_000)).toBe("750 hours of brand attention");
  });

  it("thousands-separates large values", () => {
    expect(formatEngagedMinutes(90_000)).toBe(
      "1,500 hours of brand attention",
    );
  });
});

describe("costPerEngagedMinutePence", () => {
  it("divides price by minutes and rounds to pence", () => {
    expect(costPerEngagedMinutePence(1_200_000, 900)).toBe(1333);
  });

  it("returns null when price or minutes are missing", () => {
    expect(costPerEngagedMinutePence(null, 900)).toBeNull();
    expect(costPerEngagedMinutePence(0, 900)).toBeNull();
    expect(costPerEngagedMinutePence(1_200_000, null)).toBeNull();
    expect(costPerEngagedMinutePence(1_200_000, 0)).toBeNull();
  });
});
