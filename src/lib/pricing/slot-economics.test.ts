import { describe, expect, it } from "vitest";

import {
  formatMarginRatio,
  slotEconomics,
  suggestedWholesalePence,
} from "./slot-economics";

describe("suggestedWholesalePence", () => {
  it("discounts rack by 25% and rounds to the nearest £50", () => {
    // £2,000 rack → £1,500 wholesale exactly
    expect(suggestedWholesalePence(200_000)).toBe(150_000);
    // £1,850 rack → £1,387.50 raw → £1,400 rounded
    expect(suggestedWholesalePence(185_000)).toBe(140_000);
  });
});

describe("slotEconomics", () => {
  it("derives margin and ratio when both prices are set", () => {
    const e = slotEconomics({ pricePence: 200_000, wholesalePence: 150_000 });
    expect(e.marginPence).toBe(50_000);
    expect(e.marginRatio).toBeCloseTo(0.25);
  });

  it("returns null margin when either side of the spread is unset", () => {
    expect(slotEconomics({ pricePence: 200_000 }).marginPence).toBeNull();
    expect(slotEconomics({ wholesalePence: 150_000 }).marginPence).toBeNull();
    expect(slotEconomics({}).marginRatio).toBeNull();
  });

  it("never divides by a zero rack price", () => {
    const e = slotEconomics({ pricePence: 0, wholesalePence: 0 });
    expect(e.marginPence).toBe(0);
    expect(e.marginRatio).toBeNull();
  });
});

describe("formatMarginRatio", () => {
  it("renders a whole-number percentage", () => {
    expect(formatMarginRatio(0.25)).toBe("25%");
    expect(formatMarginRatio(0.333)).toBe("33%");
  });

  it("is null-safe", () => {
    expect(formatMarginRatio(null)).toBeNull();
  });
});

