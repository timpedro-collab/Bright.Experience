import { describe, expect, it } from "vitest";

import {
  formatDiscount,
  ladderedFeePence,
  rungForEventCount,
  VOLUME_LADDER,
} from "./volume-ladder";

describe("rungForEventCount", () => {
  it("lands each commitment level on its rung", () => {
    expect(rungForEventCount(1).label).toBe("First activation");
    expect(rungForEventCount(2).label).toBe("Events 2–3");
    expect(rungForEventCount(3).label).toBe("Events 2–3");
    expect(rungForEventCount(4).label).toBe("Events 4+");
    expect(rungForEventCount(12).label).toBe("Events 4+");
  });

  it("treats zero, negative and fractional counts as sane integers", () => {
    expect(rungForEventCount(0).label).toBe("First activation");
    expect(rungForEventCount(-3).label).toBe("First activation");
    expect(rungForEventCount(2.9).label).toBe("Events 2–3");
  });

  it("keeps the ladder ascending and contiguous", () => {
    for (let i = 1; i < VOLUME_LADDER.length; i += 1) {
      const prev = VOLUME_LADDER[i - 1];
      const rung = VOLUME_LADDER[i];
      expect(prev.maxEvents).not.toBeNull();
      expect(rung.minEvents).toBe((prev.maxEvents as number) + 1);
      expect(rung.discount).toBeGreaterThanOrEqual(prev.discount);
    }
  });
});

describe("ladderedFeePence", () => {
  it("applies the rung discount to the quoted fee", () => {
    // £25,000 base: full price alone, 5% off at 2-3, 10% off at 4+.
    expect(ladderedFeePence(2_500_000, 1)).toBe(2_500_000);
    expect(ladderedFeePence(2_500_000, 3)).toBe(2_375_000);
    expect(ladderedFeePence(2_500_000, 5)).toBe(2_250_000);
  });

  it("returns zero for a zero or negative base fee", () => {
    expect(ladderedFeePence(0, 4)).toBe(0);
    expect(ladderedFeePence(-100, 4)).toBe(0);
  });

  it("rounds to whole pence", () => {
    expect(ladderedFeePence(999, 3)).toBe(949);
  });
});

describe("formatDiscount", () => {
  it("renders whole-percent labels", () => {
    expect(formatDiscount(0)).toBe("0%");
    expect(formatDiscount(0.05)).toBe("5%");
    expect(formatDiscount(0.1)).toBe("10%");
  });
});
