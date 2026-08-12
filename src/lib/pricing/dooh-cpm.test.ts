import { describe, expect, it } from "vitest";

import { EXPERIENTIAL_LOCATIONS } from "@/lib/experiential-locations";
import { cpmForTier, TIER_DOOH_CPM } from "./dooh-cpm";

describe("cpmForTier", () => {
  it("returns the benchmark for each known tier", () => {
    expect(cpmForTier("tier_1")).toBe(65);
    expect(cpmForTier("tier_2")).toBe(38);
    expect(cpmForTier("tier_3")).toBe(30);
    expect(cpmForTier("tier_4")).toBe(18);
  });

  it("falls back to the conservative tier_3 figure for unknown or missing tiers", () => {
    expect(cpmForTier("tier_99")).toBe(TIER_DOOH_CPM.tier_3);
    expect(cpmForTier(null)).toBe(TIER_DOOH_CPM.tier_3);
    expect(cpmForTier(undefined)).toBe(TIER_DOOH_CPM.tier_3);
  });

  it("keeps the ladder strictly descending so a lower tier can never claim more", () => {
    expect(TIER_DOOH_CPM.tier_1).toBeGreaterThan(TIER_DOOH_CPM.tier_2);
    expect(TIER_DOOH_CPM.tier_2).toBeGreaterThan(TIER_DOOH_CPM.tier_3);
    expect(TIER_DOOH_CPM.tier_3).toBeGreaterThan(TIER_DOOH_CPM.tier_4);
  });

  it("never exceeds the named-site CPMs that ground the same tier", () => {
    for (const location of EXPERIENTIAL_LOCATIONS) {
      expect(TIER_DOOH_CPM[location.tier]).toBeLessThanOrEqual(location.cpm);
    }
  });
});
