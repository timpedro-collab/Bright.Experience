/** Tests for the indicative proposal price band. */

import { describe, it, expect } from "vitest";
import { indicativePriceBand, formatPriceBand } from "./price-band";

describe("indicativePriceBand", () => {
  it("returns null when the quote has no usable fee", () => {
    expect(indicativePriceBand(0)).toBeNull();
    expect(indicativePriceBand(-500)).toBeNull();
    expect(indicativePriceBand(Number.NaN)).toBeNull();
  });

  it("brackets a £25,000 fee in £1,000 steps", () => {
    const band = indicativePriceBand(2_500_000);
    expect(band).toEqual({ lowPence: 2_200_000, highPence: 2_900_000 });
  });

  it("brackets a mid-size fee in £500 steps", () => {
    const band = indicativePriceBand(450_000); // £4,500
    expect(band).toEqual({ lowPence: 400_000, highPence: 550_000 });
  });

  it("always contains the real fee inside the band", () => {
    for (const fee of [15_000, 90_000, 320_000, 1_234_567, 4_800_000]) {
      const band = indicativePriceBand(fee);
      expect(band).not.toBeNull();
      expect(band!.lowPence).toBeLessThanOrEqual(fee);
      expect(band!.highPence).toBeGreaterThanOrEqual(fee);
    }
  });

  it("widens degenerate bands so low is always below high", () => {
    const band = indicativePriceBand(5_000); // £50 — snaps hard
    expect(band).not.toBeNull();
    expect(band!.lowPence).toBeLessThan(band!.highPence);
  });
});

describe("formatPriceBand", () => {
  it("formats the band as customer-facing GBP copy", () => {
    expect(
      formatPriceBand({ lowPence: 2_200_000, highPence: 3_000_000 })
    ).toBe("£22,000–£30,000");
  });
});
