/**
 * Informa deal config invariants: the NRS commercial rails carry over
 * unchanged, the levers mirror the rate-card product family, and the deal
 * engine computes a sensible mix from it.
 */
import { describe, expect, it } from "vitest";

import { computeConfigDeal } from "@/lib/deal-config";
import { INFORMA_DEAL_CONFIG, INFORMA_PP_SLUG, leverForProduct } from "./deal";
import { PRODUCT_FAMILY } from "./products";

describe("INFORMA_DEAL_CONFIG", () => {
  it("keeps the NRS commercial rails: 70/30, take-or-pay pilot, floor ladder", () => {
    expect(INFORMA_DEAL_CONFIG.split.brightBlue + INFORMA_DEAL_CONFIG.split.partner).toBe(1);
    expect(INFORMA_DEAL_CONFIG.split.partner).toBe(0.3);
    expect(INFORMA_DEAL_CONFIG.commitment).toEqual({
      pilotMinUnits: 12,
      pilotMaxUnits: 15,
      maxUnits: 50,
      cutoffWeeks: 25,
    });
    expect(INFORMA_DEAL_CONFIG.floorTiers.map((t) => t.floor)).toEqual([
      15_000, 13_500, 12_000,
    ]);
  });

  it("carries every rate-card product as a lever, plus the media unit", () => {
    // One lever per product, plus the show-placed media unit which is a
    // deployment mechanic rather than a rate-card SKU.
    expect(INFORMA_DEAL_CONFIG.levers).toHaveLength(PRODUCT_FAMILY.length + 1);
    for (const p of PRODUCT_FAMILY) {
      const lever = leverForProduct(p.id);
      expect(lever.retail.min).toBe(p.retail.min);
      expect(lever.retail.max).toBe(p.retail.max);
      expect(lever.retail.suggested).toBe(p.retail.suggested);
    }
  });

  it("hosts Loop slots only on Informa-controlled machines", () => {
    const loop = leverForProduct("loop");
    expect(loop.unitsPerItem).toBe(0);
    expect(loop.slotSource).toEqual({
      slotsPerUnit: 6,
      sourceLevers: ["rebooker", "media-unit"],
    });

    // Sponsor-sold machines carry the sponsor's brand alone: with no
    // rebooker or media units, requested slots clamp to zero.
    const noHosts = computeConfigDeal(INFORMA_DEAL_CONFIG, {
      arrival: { count: 12, retail: 60_000 },
      loop: { count: 12, retail: 5_000 },
    });
    expect(noHosts.totalUnits).toBe(12);
    expect(noHosts.gross).toBe(720_000);
  });

  it("prices media units at zero: they earn through the slots they host", () => {
    const mediaUnit = INFORMA_DEAL_CONFIG.levers.find((l) => l.key === "media-unit")!;
    expect(mediaUnit.unitsPerItem).toBe(1);
    expect(mediaUnit.retail.max).toBe(0);

    const summary = computeConfigDeal(INFORMA_DEAL_CONFIG, {
      "media-unit": { count: 2, retail: 0 },
      rebooker: { count: 1, retail: 40_000 },
      loop: { count: 18, retail: 5_000 },
    });
    // 3 host machines allow all 18 slots; media units add machines, not gross.
    expect(summary.totalUnits).toBe(3);
    expect(summary.gross).toBe(40_000 + 18 * 5_000);
  });

  it("computes a pilot mix on the shared rails", () => {
    const summary = computeConfigDeal(INFORMA_DEAL_CONFIG, {
      arrival: { count: 3, retail: 60_000 },
      draw: { count: 8, retail: 40_000 },
      rebooker: { count: 2, retail: 40_000 },
    });
    expect(summary.totalUnits).toBe(13);
    expect(summary.gross).toBe(580_000);
    expect(summary.partnerKeeps).toBe(174_000);
    expect(summary.tier.label).toBe("Pilot");
    expect(summary.belowPilotMinimum).toBe(false);
  });

  it("pins the slug credential in the admin action's format", () => {
    expect(INFORMA_PP_SLUG).toMatch(/^[a-z0-9-]{8,80}$/);
    expect(INFORMA_PP_SLUG).toMatch(/-[0-9a-f]{12}$/);
  });
});
