/** Tests for deal-registration matching + exclusivity arithmetic. */
import { describe, it, expect } from "vitest";
import {
  normaliseCompany,
  isExclusivityActive,
  exclusivityDaysRemaining,
  exclusivityExpiry,
  effectiveDealStatus,
  isDealRegistrationStatus,
  DEAL_STATUS_LABELS,
} from "./deal-registrations";

const NOW = new Date("2026-08-03T12:00:00Z");

describe("normaliseCompany", () => {
  it("collides the same company written differently", () => {
    expect(normaliseCompany("Acme Ltd")).toBe(normaliseCompany("ACME limited"));
    expect(normaliseCompany("Samsung Electronics Co.")).toBe(
      normaliseCompany("samsung   electronics")
    );
  });

  it("does not collide genuinely different companies", () => {
    expect(normaliseCompany("Acme Ltd")).not.toBe(normaliseCompany("Acme Fireworks"));
  });
});

describe("isExclusivityActive", () => {
  it("is active only for an approved registration inside the window", () => {
    expect(isExclusivityActive("approved", "2026-08-10T00:00:00Z", NOW)).toBe(true);
    expect(isExclusivityActive("approved", "2026-08-01T00:00:00Z", NOW)).toBe(false);
    expect(isExclusivityActive("pending", "2026-08-10T00:00:00Z", NOW)).toBe(false);
    expect(isExclusivityActive("approved", null, NOW)).toBe(false);
  });
});

describe("exclusivityDaysRemaining", () => {
  it("counts down and clamps at zero", () => {
    expect(exclusivityDaysRemaining("2026-08-17T12:00:00Z", NOW)).toBe(14);
    expect(exclusivityDaysRemaining("2026-08-01T00:00:00Z", NOW)).toBe(0);
    expect(exclusivityDaysRemaining(null, NOW)).toBeNull();
  });
});

describe("exclusivityExpiry", () => {
  it("grants the standard 14-day window", () => {
    expect(exclusivityExpiry(undefined, NOW)).toBe("2026-08-17T12:00:00.000Z");
  });
});

describe("effectiveDealStatus", () => {
  it("reads a lapsed approval as expired without a cron", () => {
    expect(effectiveDealStatus("approved", "2026-08-01T12:00:00Z", NOW)).toBe(
      "expired"
    );
  });

  it("keeps a live approval approved", () => {
    expect(effectiveDealStatus("approved", "2026-08-10T12:00:00Z", NOW)).toBe(
      "approved"
    );
  });

  it("passes non-approved statuses through untouched", () => {
    expect(effectiveDealStatus("pending", null, NOW)).toBe("pending");
    expect(effectiveDealStatus("rejected", "2026-08-01T12:00:00Z", NOW)).toBe(
      "rejected"
    );
  });
});

describe("status vocabulary", () => {
  it("recognises every catalogued status and rejects strangers", () => {
    for (const status of Object.keys(DEAL_STATUS_LABELS)) {
      expect(isDealRegistrationStatus(status)).toBe(true);
    }
    expect(isDealRegistrationStatus("negotiating")).toBe(false);
  });
});
