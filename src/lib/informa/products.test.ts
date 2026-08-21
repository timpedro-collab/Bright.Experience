/**
 * Product family invariants: the rate card stays coherent (bands ordered,
 * suggested inside the band), configurator presets stay inside the
 * configurator's own lever range, and lookups fail loudly.
 */
import { describe, expect, it } from "vitest";

import { formatRetailBand, PRODUCT_FAMILY, productById } from "./products";

describe("PRODUCT_FAMILY", () => {
  it("ships five products, flagship first", () => {
    expect(PRODUCT_FAMILY).toHaveLength(5);
    expect(PRODUCT_FAMILY[0].id).toBe("arrival");
  });

  it("uses the approved 45k–60k band for the in-booth machine", () => {
    const booth = productById("booth").retail;
    expect(booth).toEqual({
      min: 45_000,
      max: 60_000,
      suggested: 50_000,
      unit: "per show",
    });
  });

  it("keeps every retail band ordered with the suggested price inside it", () => {
    for (const p of PRODUCT_FAMILY) {
      expect(p.retail.min).toBeLessThan(p.retail.max);
      expect(p.retail.suggested).toBeGreaterThanOrEqual(p.retail.min);
      expect(p.retail.suggested).toBeLessThanOrEqual(p.retail.max);
    }
  });

  it("keeps configurator presets inside the configurator's 30k to 75k lever", () => {
    for (const p of PRODUCT_FAMILY) {
      if (p.configuratorPrice == null) continue;
      expect(p.configuratorPrice).toBeGreaterThanOrEqual(30_000);
      expect(p.configuratorPrice).toBeLessThanOrEqual(75_000);
    }
  });

  it("only offers configurator pricing on sponsor machine products", () => {
    const withPreset = PRODUCT_FAMILY.filter((p) => p.configuratorPrice != null);
    expect(withPreset.map((p) => p.id).sort()).toEqual([
      "arrival",
      "booth",
      "floor",
    ]);
  });

  it("gives every product a complete rate-card entry", () => {
    for (const p of PRODUCT_FAMILY) {
      expect(p.name).toBeTruthy();
      expect(p.descriptor).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(p.includes.length).toBeGreaterThanOrEqual(3);
      expect(p.measures.length).toBeGreaterThanOrEqual(2);
      expect(p.placement).toBeTruthy();
    }
  });
});

describe("formatRetailBand", () => {
  it("prints the band with its unit", () => {
    expect(formatRetailBand(productById("arrival"))).toBe(
      "$50,000 to $75,000 per show"
    );
    expect(formatRetailBand(productById("loop"))).toBe(
      "$3,000 to $8,000 per slot, per show"
    );
  });
});

describe("productById", () => {
  it("throws on unknown ids so typos fail loudly", () => {
    expect(() => productById("nope")).toThrow(/Unknown Informa product id/);
  });
});
