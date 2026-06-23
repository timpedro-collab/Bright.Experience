/**
 * Tests for the Bright.Studio rate card + asset spec catalogue.
 *
 * Pricing matters — keep these tests in sync with the rate card on
 * brightblue.com so the customer never sees mismatched numbers.
 */

import { describe, it, expect } from "vitest";
import {
  ASSET_SPECS,
  STUDIO_TIERS,
  STUDIO_TURNAROUND,
  formatTierPrice,
  mediumLabel,
} from "./bright-studio";

describe("ASSET_SPECS", () => {
  it("uses unique slugs", () => {
    const slugs = ASSET_SPECS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("classifies each spec as static or motion", () => {
    for (const spec of ASSET_SPECS) {
      expect(["static", "motion"]).toContain(spec.medium);
    }
  });

  it("classifies the attract-loop as motion", () => {
    const attract = ASSET_SPECS.find((s) => s.slug === "screen-attract");
    expect(attract?.medium).toBe("motion");
  });
});

describe("STUDIO_TIERS", () => {
  it("has exactly three tiers in escalating order", () => {
    expect(STUDIO_TIERS.map((t) => t.slug)).toEqual([
      "essential",
      "professional",
      "new-asset",
    ]);
  });

  it("static pricing escalates between tiers", () => {
    expect(STUDIO_TIERS[0].staticPricePence).toBeLessThan(STUDIO_TIERS[1].staticPricePence);
    expect(STUDIO_TIERS[1].staticPricePence).toBeLessThan(STUDIO_TIERS[2].staticPricePence);
  });

  it("motion pricing escalates between tiers", () => {
    expect(STUDIO_TIERS[0].motionPricePence).toBeLessThan(STUDIO_TIERS[1].motionPricePence);
    expect(STUDIO_TIERS[1].motionPricePence).toBeLessThan(STUDIO_TIERS[2].motionPricePence);
  });

  it("motion is always pricier than static at the same tier", () => {
    for (const tier of STUDIO_TIERS) {
      expect(tier.motionPricePence).toBeGreaterThan(tier.staticPricePence);
    }
  });
});

describe("STUDIO_TURNAROUND", () => {
  it("uses 7 standard working days + 50% express uplift", () => {
    expect(STUDIO_TURNAROUND.standardWorkingDays).toBe(7);
    expect(STUDIO_TURNAROUND.expressUpliftPercent).toBe(50);
  });
});

describe("formatTierPrice", () => {
  const essential = STUDIO_TIERS[0];

  it("formats static and motion prices as USD", () => {
    expect(formatTierPrice(essential, "static")).toBe("$32");
    expect(formatTierPrice(essential, "motion")).toBe("$160");
  });

  it("scales across tiers", () => {
    const newAsset = STUDIO_TIERS[2];
    expect(formatTierPrice(newAsset, "static")).toBe("$120");
    expect(formatTierPrice(newAsset, "motion")).toBe("$1,080");
  });
});

describe("mediumLabel", () => {
  it("returns 'Motion' for motion", () => {
    expect(mediumLabel("motion")).toBe("Motion");
  });
  it("returns 'Static' for static", () => {
    expect(mediumLabel("static")).toBe("Static");
  });
});
