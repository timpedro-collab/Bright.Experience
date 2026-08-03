/** Tests for the pricing-page persona vocabulary. */
import { describe, it, expect } from "vitest";
import { PRICING_PERSONAS, isPricingPersona } from "./personas";

describe("PRICING_PERSONAS", () => {
  it("covers the four buying audiences", () => {
    expect(PRICING_PERSONAS.map((p) => p.id)).toEqual([
      "brand",
      "agency",
      "organizer",
      "venue",
    ]);
  });
});

describe("isPricingPersona", () => {
  it("accepts canonical persona ids", () => {
    expect(isPricingPersona("brand")).toBe(true);
    expect(isPricingPersona("venue")).toBe(true);
  });

  it("rejects unknown values and non-strings", () => {
    expect(isPricingPersona("sponsor")).toBe(false);
    expect(isPricingPersona("")).toBe(false);
    expect(isPricingPersona(undefined)).toBe(false);
    expect(isPricingPersona(42)).toBe(false);
  });
});
