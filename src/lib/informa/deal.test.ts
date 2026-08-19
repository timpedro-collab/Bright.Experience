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

  it("hosts ad slots only on Informa-controlled machines", () => {
    const loop = leverForProduct("loop");
    expect(loop.unitsPerItem).toBe(0);
    expect(loop.slotSource).toEqual({
      slotsPerUnit: 6,
      sourceLevers: ["rebooker", "media-unit"],
    });

    // Sponsor-sold machines carry the sponsor's brand alone: with no
    // rebooking engines or media units, requested slots clamp to zero.
    const noHosts = computeConfigDeal(INFORMA_DEAL_CONFIG, {
      arrival: { count: 12, retail: 60_000 },
      loop: { count: 12, retail: 5_000 },
    });
    expect(noHosts.totalUnits).toBe(12);
    expect(noHosts.gross).toBe(720_000);
  });

  it("treats the rebooking engine as a fee Informa pays, never split revenue", () => {
    const rebooker = leverForProduct("rebooker");
    expect(rebooker.revenue).toBe("service");

    const summary = computeConfigDeal(INFORMA_DEAL_CONFIG, {
      "media-unit": { count: 2, retail: 0 },
      rebooker: { count: 1, retail: 40_000 },
      loop: { count: 18, retail: 5_000 },
    });
    // Gross carries only sponsorship revenue (the 18 slots); the rebooking
    // fee flows to Bright.Blue directly and nets off Informa's position.
    expect(summary.totalUnits).toBe(3);
    expect(summary.gross).toBe(18 * 5_000);
    expect(summary.serviceFees).toBe(40_000);
    expect(summary.netToPartner).toBe(27_000 - 40_000);
  });

  it("prices media units at zero: they earn through the slots they host", () => {
    const mediaUnit = INFORMA_DEAL_CONFIG.levers.find((l) => l.key === "media-unit")!;
    expect(mediaUnit.unitsPerItem).toBe(1);
    expect(mediaUnit.retail.max).toBe(0);
  });

  it("computes a pilot mix on the shared rails", () => {
    const summary = computeConfigDeal(INFORMA_DEAL_CONFIG, {
      arrival: { count: 3, retail: 60_000 },
      draw: { count: 8, retail: 40_000 },
      rebooker: { count: 2, retail: 40_000 },
    });
    expect(summary.totalUnits).toBe(13);
    expect(summary.gross).toBe(500_000);
    expect(summary.partnerKeeps).toBe(150_000);
    expect(summary.serviceFees).toBe(80_000);
    expect(summary.netToPartner).toBe(70_000);
    expect(summary.tier.label).toBe("Pilot");
    expect(summary.belowPilotMinimum).toBe(false);
    expect(summary.floorGap).toBe(0);
  });

  it("ships presets that clear the fleet cap, slot ceiling, floor and pilot minimum", () => {
    const presets = INFORMA_DEAL_CONFIG.presets ?? [];
    expect(presets.map((p) => p.key)).toEqual(["pilot", "scale", "portfolio"]);

    for (const preset of presets) {
      const inputs = Object.fromEntries(
        INFORMA_DEAL_CONFIG.levers.map((l) => [
          l.key,
          { count: preset.counts[l.key] ?? 0, retail: l.retail.suggested },
        ]),
      );
      const summary = computeConfigDeal(INFORMA_DEAL_CONFIG, inputs);

      // No preset may rely on the engine clamping it into legality: every
      // requested item survives, the floor is funded, the pilot is met.
      const requestedUnits = INFORMA_DEAL_CONFIG.levers.reduce(
        (sum, l) => sum + (preset.counts[l.key] ?? 0) * l.unitsPerItem,
        0,
      );
      expect(summary.totalUnits).toBe(requestedUnits);
      expect(summary.totalUnits).toBeLessThanOrEqual(
        INFORMA_DEAL_CONFIG.commitment.maxUnits,
      );
      expect(summary.belowPilotMinimum).toBe(false);
      expect(summary.floorGap).toBe(0);

      const loop = leverForProduct("loop");
      const hostUnits =
        (preset.counts["rebooker"] ?? 0) + (preset.counts["media-unit"] ?? 0);
      expect(preset.counts["loop"] ?? 0).toBeLessThanOrEqual(
        hostUnits * loop.slotSource!.slotsPerUnit,
      );
    }
  });

  it("pins the slug credential in the admin action's format", () => {
    expect(INFORMA_PP_SLUG).toMatch(/^[a-z0-9-]{8,80}$/);
    expect(INFORMA_PP_SLUG).toMatch(/-[0-9a-f]{12}$/);
  });
});
