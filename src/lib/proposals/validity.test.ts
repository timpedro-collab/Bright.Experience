/** Tests for proposal validity countdown arithmetic. */
import { describe, it, expect } from "vitest";
import { daysUntilExpiry, validityLabel } from "./validity";

const NOW = new Date("2026-08-02T18:00:00Z");

describe("daysUntilExpiry", () => {
  it("returns whole days remaining, rounding up partial days", () => {
    expect(daysUntilExpiry("2026-08-14T18:00:00Z", NOW)).toBe(12);
    expect(daysUntilExpiry("2026-08-03T06:00:00Z", NOW)).toBe(1);
  });

  it("clamps past expiries to zero", () => {
    expect(daysUntilExpiry("2026-08-01T00:00:00Z", NOW)).toBe(0);
  });

  it("returns null when no expiry is set or it is unparseable", () => {
    expect(daysUntilExpiry(null, NOW)).toBeNull();
    expect(daysUntilExpiry(undefined, NOW)).toBeNull();
    expect(daysUntilExpiry("not-a-date", NOW)).toBeNull();
  });
});

describe("validityLabel", () => {
  it("reads naturally for plural, singular, and expired", () => {
    expect(validityLabel(12)).toBe("Valid for 12 more days");
    expect(validityLabel(1)).toBe("Valid for 1 more day");
    expect(validityLabel(0)).toBe("This proposal has expired");
  });

  it("says nothing when there is no expiry", () => {
    expect(validityLabel(null)).toBeNull();
  });
});
