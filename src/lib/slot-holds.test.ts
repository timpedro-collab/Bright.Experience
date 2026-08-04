/** Tests for slot hold arithmetic. */
import { describe, it, expect } from "vitest";
import { isHoldActive, holdDaysRemaining, holdExpiry } from "./slot-holds";

const NOW = new Date("2026-08-03T12:00:00Z");

describe("isHoldActive", () => {
  it("is active only for a reserved slot with a future expiry", () => {
    expect(isHoldActive("reserved", "2026-08-10T00:00:00Z", NOW)).toBe(true);
  });

  it("is inactive once expired, for other statuses, or with no hold", () => {
    expect(isHoldActive("reserved", "2026-08-01T00:00:00Z", NOW)).toBe(false);
    expect(isHoldActive("available", "2026-08-10T00:00:00Z", NOW)).toBe(false);
    expect(isHoldActive("reserved", null, NOW)).toBe(false);
  });
});

describe("holdDaysRemaining", () => {
  it("counts whole days up, clamps at zero, and stays quiet with no hold", () => {
    expect(holdDaysRemaining("2026-08-10T12:00:00Z", NOW)).toBe(7);
    expect(holdDaysRemaining("2026-08-03T18:00:00Z", NOW)).toBe(1);
    expect(holdDaysRemaining("2026-08-01T00:00:00Z", NOW)).toBe(0);
    expect(holdDaysRemaining(null, NOW)).toBeNull();
    expect(holdDaysRemaining("garbage", NOW)).toBeNull();
  });
});

describe("holdExpiry", () => {
  it("defaults to a 14-day window", () => {
    expect(holdExpiry(undefined, NOW)).toBe("2026-08-17T12:00:00.000Z");
  });
});
