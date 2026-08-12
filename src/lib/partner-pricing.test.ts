import { describe, expect, it } from "vitest";

import {
  clampRetail,
  computeDeal,
  floorTierForVolume,
  formatUsd,
  formatUsdCompact,
  COMMITMENT,
  FLOOR_TIERS,
  RETAIL,
  REVENUE_SPLIT,
} from "./partner-pricing";

describe("floorTierForVolume", () => {
  it("lands pilot volumes in the $15k tier", () => {
    expect(floorTierForVolume(1).floor).toBe(15_000);
    expect(floorTierForVolume(12).floor).toBe(15_000);
    expect(floorTierForVolume(15).floor).toBe(15_000);
  });

  it("steps the floor down at 16 and 31 units", () => {
    expect(floorTierForVolume(16).floor).toBe(13_500);
    expect(floorTierForVolume(30).floor).toBe(13_500);
    expect(floorTierForVolume(31).floor).toBe(12_000);
    expect(floorTierForVolume(50).floor).toBe(12_000);
  });

  it("clamps out-of-range volumes instead of throwing", () => {
    expect(floorTierForVolume(0).floor).toBe(15_000);
    expect(floorTierForVolume(999).floor).toBe(12_000);
  });

  it("never moves the split with volume — only the floor steps", () => {
    // The ladder rewards volume through the floor alone; a tier carrying its
    // own split would contradict the locked 60/40 structure.
    for (const tier of FLOOR_TIERS) {
      expect(tier).not.toHaveProperty("split");
    }
    expect(REVENUE_SPLIT.brightBlue + REVENUE_SPLIT.partner).toBe(1);
  });
});

describe("clampRetail", () => {
  it("holds the single-unit floor at $45k no matter what is asked", () => {
    expect(clampRetail(30_000, RETAIL.single)).toBe(45_000);
    expect(clampRetail(0, RETAIL.single)).toBe(45_000);
  });

  it("caps at the top of the band and passes through in-band values", () => {
    expect(clampRetail(95_000, RETAIL.single)).toBe(70_000);
    expect(clampRetail(52_000, RETAIL.single)).toBe(52_000);
  });
});

describe("computeDeal", () => {
  it("splits a 12-single pilot 60/40 at suggested retail", () => {
    const deal = computeDeal({
      singles: 12,
      singleRetail: RETAIL.single.suggested,
      takeovers: 0,
      takeoverRetail: RETAIL.takeover.suggested,
    });
    expect(deal.totalUnits).toBe(12);
    expect(deal.gross).toBe(600_000);
    expect(deal.partnerKeeps).toBe(240_000);
    expect(deal.brightBlueShare).toBe(360_000);
    expect(deal.partnerKeeps + deal.brightBlueShare).toBe(deal.gross);
    expect(deal.belowPilotMinimum).toBe(false);
  });

  it("counts each takeover bundle as three deployed units", () => {
    const deal = computeDeal({
      singles: 10,
      singleRetail: 45_000,
      takeovers: 2,
      takeoverRetail: 115_000,
    });
    expect(deal.totalUnits).toBe(16);
    expect(deal.gross).toBe(10 * 45_000 + 2 * 115_000);
    expect(deal.tier.label).toBe("Scale");
  });

  it("caps takeover bundles at the scarcity limit", () => {
    const deal = computeDeal({
      singles: 0,
      singleRetail: 45_000,
      takeovers: 99,
      takeoverRetail: 115_000,
    });
    expect(deal.totalUnits).toBe(RETAIL.takeover.maxBundles * 3);
  });

  it("flags volumes under the take-or-pay minimum", () => {
    const below = computeDeal({
      singles: COMMITMENT.pilotMinUnits - 1,
      singleRetail: 45_000,
      takeovers: 0,
      takeoverRetail: 115_000,
    });
    expect(below.belowPilotMinimum).toBe(true);

    const empty = computeDeal({
      singles: 0,
      singleRetail: 45_000,
      takeovers: 0,
      takeoverRetail: 115_000,
    });
    expect(empty.belowPilotMinimum).toBe(false);
    expect(empty.partnerKeepsPerUnit).toBe(0);
  });

  it("clamps retail inputs below the band back to the floor", () => {
    const deal = computeDeal({
      singles: 1,
      singleRetail: 10_000,
      takeovers: 0,
      takeoverRetail: 115_000,
    });
    expect(deal.gross).toBe(45_000);
  });
});

describe("USD formatting", () => {
  it("renders whole dollars and compact stat values", () => {
    expect(formatUsd(45_000)).toBe("$45,000");
    expect(formatUsdCompact(45_000)).toBe("$45k");
    expect(formatUsdCompact(1_230_000)).toBe("$1.2m");
    expect(formatUsdCompact(2_000_000)).toBe("$2m");
    expect(formatUsdCompact(950)).toBe("$950");
  });

  it("keeps derived per-unit figures consistent with their totals", () => {
    // $392k retained across 20 machines is $19.6k each — rounding it to
    // "$20k" makes the three headline stats visibly disagree.
    expect(formatUsdCompact(19_600)).toBe("$19.6k");
    expect(formatUsdCompact(20_000)).toBe("$20k");
    expect(formatUsdCompact(392_000)).toBe("$392k");
  });
});
