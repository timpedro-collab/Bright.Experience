/** Tests for the canonical commercial tier vocabulary. */

import { describe, it, expect } from "vitest";
import { UPSELL_SLUGS } from "@/lib/capabilities";
import {
  TIERS,
  getTier,
  tiersForDisplay,
  isTierSlug,
  isAddOnEligible,
  formatTierBand,
} from "./tiers";

describe("TIERS", () => {
  it("exposes four tiers in ascending price order", () => {
    expect(TIERS).toHaveLength(4);

    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].bands.uk.lowMinor).toBeGreaterThan(
        TIERS[i - 1].bands.uk.lowMinor,
      );
    }
  });

  it("every included capability slug exists in the capability vocabulary", () => {
    for (const tier of TIERS) {
      for (const slug of tier.includedCapabilitySlugs) {
        expect(UPSELL_SLUGS.has(slug)).toBe(true);
      }
    }
  });
});

describe("tiersForDisplay", () => {
  it("presents Best first with Bespoke closing", () => {
    expect(tiersForDisplay().map((t) => t.slug)).toEqual([
      "command",
      "lead-engine",
      "showstopper",
      "bespoke",
    ]);
  });
});

describe("getTier", () => {
  it("returns the tier for a known slug and null for unknown", () => {
    expect(getTier("lead-engine")!.displayName).toBe("Lead Engine");
    expect(getTier("platinum")).toBeNull();
  });
});

describe("isTierSlug", () => {
  it("accepts canonical slugs and rejects everything else", () => {
    expect(isTierSlug("showstopper")).toBe(true);
    expect(isTierSlug("premium")).toBe(false);
    expect(isTierSlug(42)).toBe(false);
    expect(isTierSlug(null)).toBe(false);
  });
});

describe("tier badges", () => {
  it("only the middle tier carries the most-popular badge", () => {
    const popular = TIERS.filter((t) => t.badge === "most-popular");
    expect(popular).toHaveLength(1);
    expect(popular[0].slug).toBe("lead-engine");
  });
});

describe("formatTierBand", () => {
  it("closed bands format as a range", () => {
    expect(formatTierBand(getTier("showstopper")!, "uk")).toBe(
      "£9,500–£13,500",
    );
    expect(formatTierBand(getTier("lead-engine")!, "us")).toBe(
      "$32,000–$48,000",
    );
    expect(formatTierBand(getTier("command")!, "eu")).toBe(
      "€31,500–€47,500",
    );
  });

  it("open bespoke bands format as From X", () => {
    expect(formatTierBand(getTier("bespoke")!, "uk")).toBe("From £50,000");
  });
});

describe("isAddOnEligible", () => {
  it("included capabilities are never offered as add-ons", () => {
    expect(isAddOnEligible(getTier("command")!, "live-telemetry")).toBe(
      false,
    );
  });

  it("data-dependent add-ons require the lead-capture layer", () => {
    expect(isAddOnEligible(getTier("showstopper")!, "survey-layer")).toBe(
      false,
    );
    expect(isAddOnEligible(getTier("lead-engine")!, "survey-layer")).toBe(
      true,
    );
    expect(
      isAddOnEligible(getTier("lead-engine")!, "branded-landing-page"),
    ).toBe(true);
    expect(isAddOnEligible(getTier("showstopper")!, "linkedin-follow")).toBe(
      false,
    );
  });

  it("hardware add-ons are offerable on any tier", () => {
    expect(isAddOnEligible(getTier("showstopper")!, "sampling-unlock")).toBe(
      true,
    );
    expect(isAddOnEligible(getTier("showstopper")!, "age-verification")).toBe(
      true,
    );
  });
});

describe("region bands", () => {
  it("every tier has a band for every region", () => {
    const regions = ["uk", "us", "eu"] as const;

    for (const tier of TIERS) {
      for (const region of regions) {
        const band = tier.bands[region];
        expect(band).toBeDefined();
        expect(band.lowMinor).toBeGreaterThan(0);
        if (band.highMinor !== null) {
          expect(band.highMinor).toBeGreaterThan(band.lowMinor);
        }
      }
    }
  });
});
