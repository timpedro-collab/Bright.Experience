import { describe, it, expect } from "vitest";
import {
  getLocalHour,
  isWithinQuietHours,
  shouldSendDigest,
  type DigestTiming,
} from "./digest-timing";

describe("getLocalHour", () => {
  it("converts a UTC instant to the recipient's local hour", () => {
    // 2026-06-01 12:00 UTC. London is BST (UTC+1) in June -> 13:00.
    const now = new Date("2026-06-01T12:00:00Z");
    expect(getLocalHour(now, "Europe/London")).toBe(13);
    // Chicago is CDT (UTC-5) in June -> 07:00.
    expect(getLocalHour(now, "America/Chicago")).toBe(7);
  });

  it("falls back to the UTC hour for an invalid timezone", () => {
    const now = new Date("2026-06-01T15:00:00Z");
    expect(getLocalHour(now, "Not/AZone")).toBe(15);
  });
});

describe("isWithinQuietHours", () => {
  it("handles a window that wraps past midnight (21 -> 8)", () => {
    expect(isWithinQuietHours(22, 21, 8)).toBe(true);
    expect(isWithinQuietHours(3, 21, 8)).toBe(true);
    expect(isWithinQuietHours(8, 21, 8)).toBe(false);
    expect(isWithinQuietHours(12, 21, 8)).toBe(false);
  });

  it("handles a same-day window (1 -> 6)", () => {
    expect(isWithinQuietHours(2, 1, 6)).toBe(true);
    expect(isWithinQuietHours(6, 1, 6)).toBe(false);
    expect(isWithinQuietHours(0, 1, 6)).toBe(false);
  });

  it("treats a zero-width window as disabled", () => {
    expect(isWithinQuietHours(0, 9, 9)).toBe(false);
    expect(isWithinQuietHours(9, 9, 9)).toBe(false);
  });
});

describe("shouldSendDigest", () => {
  const base: DigestTiming = {
    timezone: "Europe/London",
    digestHour: 9,
    quietStartHour: 21,
    quietEndHour: 8,
    lastSentAt: null,
  };

  it("sends at the recipient's local digest hour", () => {
    // 08:00 UTC in June -> 09:00 London.
    const now = new Date("2026-06-01T08:00:00Z");
    expect(shouldSendDigest(now, base)).toBe(true);
  });

  it("does not send outside the local digest hour", () => {
    // 12:00 UTC -> 13:00 London, not 09:00.
    const now = new Date("2026-06-01T12:00:00Z");
    expect(shouldSendDigest(now, base)).toBe(false);
  });

  it("suppresses a second send within the 20h dedup window", () => {
    const now = new Date("2026-06-01T08:00:00Z");
    const recentlySent: DigestTiming = {
      ...base,
      lastSentAt: new Date("2026-06-01T05:00:00Z"),
    };
    expect(shouldSendDigest(now, recentlySent)).toBe(false);
  });

  it("sends again the next day once the dedup window has passed", () => {
    const now = new Date("2026-06-02T08:00:00Z");
    const sentYesterday: DigestTiming = {
      ...base,
      lastSentAt: new Date("2026-06-01T08:00:00Z"),
    };
    expect(shouldSendDigest(now, sentYesterday)).toBe(true);
  });

  it("respects a different timezone", () => {
    // Recipient in Chicago wants 09:00 local. 14:00 UTC -> 09:00 CDT.
    const chicago: DigestTiming = { ...base, timezone: "America/Chicago" };
    expect(shouldSendDigest(new Date("2026-06-01T14:00:00Z"), chicago)).toBe(true);
    expect(shouldSendDigest(new Date("2026-06-01T08:00:00Z"), chicago)).toBe(false);
  });

  it("does not send when the digest hour sits inside quiet hours", () => {
    const quietDigest: DigestTiming = {
      ...base,
      digestHour: 23,
      quietStartHour: 21,
      quietEndHour: 8,
    };
    // 22:00 UTC -> 23:00 London = digest hour, but inside quiet hours.
    expect(shouldSendDigest(new Date("2026-06-01T22:00:00Z"), quietDigest)).toBe(
      false,
    );
  });
});
