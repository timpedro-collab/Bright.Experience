/**
 * Tests for the quoting and proposal-intake schemas. The intake schema
 * is the boundary between the public-facing quiz form and our DB —
 * heavy coverage here pays for itself.
 */

import { describe, it, expect } from "vitest";
import { bookNowSchema, proposalIntakeSchema } from "./quotes";

describe("bookNowSchema", () => {
  const valid = {
    packageId: "00000000-0000-4000-8000-000000000001",
    datesStart: "2026-06-15",
    contactName: "Tim Pedro",
    contactEmail: "tim@brightblue.test",
  };

  it("accepts a valid minimal booking", () => {
    expect(() => bookNowSchema.parse(valid)).not.toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      bookNowSchema.parse({ ...valid, contactEmail: "not-an-email" })
    ).toThrow(/Valid email/);
  });

  it("rejects a short contact name", () => {
    expect(() =>
      bookNowSchema.parse({ ...valid, contactName: "T" })
    ).toThrow(/Contact name/);
  });

  it("rejects an invalid packageId UUID", () => {
    expect(() =>
      bookNowSchema.parse({ ...valid, packageId: "garbage" })
    ).toThrow(/Package selection/);
  });

  it("rejects empty datesStart", () => {
    expect(() =>
      bookNowSchema.parse({ ...valid, datesStart: "" })
    ).toThrow(/Start date/);
  });
});

describe("proposalIntakeSchema", () => {
  const valid = {
    eventType: "trade-show",
    locationPostcode: "E16 1XL",
    datesStart: "2026-06-15",
    contactName: "Tim Pedro",
    contactEmail: "tim@brightblue.test",
  };

  it("accepts a valid minimal intake", () => {
    expect(() => proposalIntakeSchema.parse(valid)).not.toThrow();
  });

  it("rejects missing eventType", () => {
    expect(() =>
      proposalIntakeSchema.parse({ ...valid, eventType: "" })
    ).toThrow(/Event type/);
  });

  it("rejects missing postcode", () => {
    expect(() =>
      proposalIntakeSchema.parse({ ...valid, locationPostcode: "" })
    ).toThrow(/Location postcode/);
  });

  it("rejects non-positive footfall estimates", () => {
    expect(() =>
      proposalIntakeSchema.parse({ ...valid, footfallEstimate: 0 })
    ).toThrow();
    expect(() =>
      proposalIntakeSchema.parse({ ...valid, footfallEstimate: -10 })
    ).toThrow();
  });

  it("accepts a positive footfall estimate", () => {
    expect(() =>
      proposalIntakeSchema.parse({ ...valid, footfallEstimate: 5000 })
    ).not.toThrow();
  });
});
