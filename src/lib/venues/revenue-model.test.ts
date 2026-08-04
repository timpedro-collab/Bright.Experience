/** Tests for the typed venue revenue models. */
import { describe, it, expect } from "vitest";

import {
  parseRevenueModel,
  venueShareForBooked,
  formatRevenueModel,
} from "./revenue-model";

describe("parseRevenueModel", () => {
  it("parses a straight revenue share", () => {
    expect(parseRevenueModel({ model: "revenue_share", rate: 0.18 })).toEqual({
      model: "revenue_share",
      rate: 0.18,
    });
  });

  it("reads a legacy share-with-floor as guarantee vs share", () => {
    expect(
      parseRevenueModel({ model: "revenue_share", rate: 0.18, floor_usd: 6000 }),
    ).toEqual({
      model: "guarantee_overage",
      guaranteePence: 600_000,
      overageRate: 0.18,
    });
  });

  it("converts a legacy whole-unit fixed fee to pence", () => {
    expect(parseRevenueModel({ model: "fixed_fee", fee_usd: 22000 })).toEqual({
      model: "fixed_fee",
      feePence: 2_200_000,
    });
  });

  it("prefers an explicit pence fee over the legacy field", () => {
    expect(
      parseRevenueModel({ model: "fixed_fee", feePence: 500_000, fee_usd: 1 }),
    ).toEqual({ model: "fixed_fee", feePence: 500_000 });
  });

  it("parses a guarantee-vs-share model", () => {
    expect(
      parseRevenueModel({
        model: "guarantee_overage",
        guaranteePence: 400_000,
        overageRate: 0.25,
      }),
    ).toEqual({
      model: "guarantee_overage",
      guaranteePence: 400_000,
      overageRate: 0.25,
    });
  });

  it("reads unknown or unusable shapes as unconfigured", () => {
    expect(parseRevenueModel(null)).toBeNull();
    expect(parseRevenueModel({})).toBeNull();
    expect(parseRevenueModel({ model: "media_rate", rate_usd: 950 })).toBeNull();
    expect(parseRevenueModel({ model: "revenue_share", rate: 0 })).toBeNull();
    expect(parseRevenueModel({ model: "revenue_share", rate: 1.5 })).toBeNull();
    expect(parseRevenueModel({ model: "fixed_fee" })).toBeNull();
    expect(
      parseRevenueModel({ model: "guarantee_overage", guaranteePence: 100 }),
    ).toBeNull();
  });
});

describe("venueShareForBooked", () => {
  it("takes the configured percentage of booked revenue", () => {
    expect(
      venueShareForBooked(1_000_000, { model: "revenue_share", rate: 0.18 }),
    ).toBe(180_000);
  });

  it("pays the flat fee regardless of bookings", () => {
    expect(
      venueShareForBooked(0, { model: "fixed_fee", feePence: 600_000 }),
    ).toBe(600_000);
    expect(
      venueShareForBooked(9_000_000, { model: "fixed_fee", feePence: 600_000 }),
    ).toBe(600_000);
  });

  it("pays the guarantee when the share falls short", () => {
    expect(
      venueShareForBooked(1_000_000, {
        model: "guarantee_overage",
        guaranteePence: 400_000,
        overageRate: 0.2,
      }),
    ).toBe(400_000);
  });

  it("pays the share once it clears the guarantee", () => {
    expect(
      venueShareForBooked(3_000_000, {
        model: "guarantee_overage",
        guaranteePence: 400_000,
        overageRate: 0.2,
      }),
    ).toBe(600_000);
  });

  it("never returns a negative share", () => {
    expect(
      venueShareForBooked(-500, { model: "revenue_share", rate: 0.2 }),
    ).toBe(0);
  });
});

describe("formatRevenueModel", () => {
  it("describes each model in the venue's own vocabulary", () => {
    expect(formatRevenueModel({ model: "revenue_share", rate: 0.18 })).toBe(
      "18% of booked revenue",
    );
    expect(formatRevenueModel({ model: "fixed_fee", feePence: 600_000 })).toBe(
      "£6,000 flat",
    );
    expect(
      formatRevenueModel({
        model: "guarantee_overage",
        guaranteePence: 400_000,
        overageRate: 0.25,
      }),
    ).toBe("£4,000 guaranteed or 25%, whichever is greater");
  });
});
