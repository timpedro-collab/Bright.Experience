import { describe, it, expect } from "vitest";
import {
  PITCH_TOKEN_DEFAULT_DAYS,
  pitchTokenExpiry,
  isPitchTokenValid,
  pitchTokenDaysRemaining,
  toSponsorPerformance,
} from "./sponsor-pitch";

const NOW = new Date("2026-09-01T12:00:00Z");

describe("pitchTokenExpiry", () => {
  it("defaults to the standard window", () => {
    const expiry = pitchTokenExpiry(undefined, NOW);
    const days = Math.round(
      (expiry.getTime() - NOW.getTime()) / (24 * 60 * 60 * 1000)
    );
    expect(days).toBe(PITCH_TOKEN_DEFAULT_DAYS);
  });

  it("honours an explicit window", () => {
    expect(pitchTokenExpiry(7, NOW).toISOString()).toBe("2026-09-08T12:00:00.000Z");
  });
});

describe("isPitchTokenValid", () => {
  it("accepts a link that has not expired", () => {
    expect(isPitchTokenValid("2026-09-02T12:00:00Z", NOW)).toBe(true);
  });

  it("rejects a link past its expiry", () => {
    expect(isPitchTokenValid("2026-08-31T12:00:00Z", NOW)).toBe(false);
  });

  it("rejects a link expiring exactly now", () => {
    expect(isPitchTokenValid(NOW.toISOString(), NOW)).toBe(false);
  });

  it("fails closed when no expiry was ever recorded", () => {
    expect(isPitchTokenValid(null, NOW)).toBe(false);
    expect(isPitchTokenValid(undefined, NOW)).toBe(false);
  });

  it("fails closed on an unparseable expiry", () => {
    expect(isPitchTokenValid("not-a-date", NOW)).toBe(false);
  });
});

describe("pitchTokenDaysRemaining", () => {
  it("rounds up part-days so 'expires in 1 day' is never shown as zero", () => {
    expect(pitchTokenDaysRemaining("2026-09-02T06:00:00Z", NOW)).toBe(1);
  });

  it("reports zero for an expired or missing link", () => {
    expect(pitchTokenDaysRemaining("2026-08-01T12:00:00Z", NOW)).toBe(0);
    expect(pitchTokenDaysRemaining(null, NOW)).toBe(0);
  });
});

describe("toSponsorPerformance", () => {
  it("derives the opt-in rate from plays and leads", () => {
    expect(toSponsorPerformance({ plays: 200, leads: 150, prizes: 180 })).toEqual({
      plays: 200,
      leads: 150,
      prizes: 180,
      optInRate: 75,
    });
  });

  it("avoids dividing by zero before a show starts", () => {
    expect(toSponsorPerformance({ plays: 0, leads: 0, prizes: 0 }).optInRate).toBe(0);
  });

  it("drops any field that isn't sponsor-safe", () => {
    const performance = toSponsorPerformance({
      plays: 10,
      leads: 5,
      prizes: 5,
      // @ts-expect-error — proving a stray PII field cannot survive the reducer
      contactEmail: "attendee@example.com",
    });
    expect(Object.keys(performance).sort()).toEqual([
      "leads",
      "optInRate",
      "plays",
      "prizes",
    ]);
  });
});
