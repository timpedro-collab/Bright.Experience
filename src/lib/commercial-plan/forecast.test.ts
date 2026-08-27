/** Tests the confidential commercial-plan forecast arithmetic and guardrails. */
import { describe, expect, it } from "vitest";

import {
  forecastFor,
  formatCompactUsd,
  formatExactUsd,
  SALES_CHANNELS,
  splitExample,
} from "./forecast";

describe("sales channel assumptions", () => {
  it("allocates every sale fully between the channel and Bright.Blue", () => {
    for (const channel of SALES_CHANNELS) {
      expect(channel.channelShare + channel.brightBlueShare).toBeCloseTo(1);
      expect(channel.averageSaleUsd).toBeGreaterThan(0);
    }
  });

  it("expresses the standardized $50k split for each channel", () => {
    expect(splitExample(SALES_CHANNELS[0])).toEqual({
      channelGetsUsd: 0,
      brightBlueGetsUsd: 50_000,
    });
    expect(splitExample(SALES_CHANNELS[1])).toEqual({
      channelGetsUsd: 15_000,
      brightBlueGetsUsd: 35_000,
    });
    expect(splitExample(SALES_CHANNELS[2])).toEqual({
      channelGetsUsd: 6_250,
      brightBlueGetsUsd: 43_750,
    });
    expect(splitExample(SALES_CHANNELS[3])).toEqual({
      channelGetsUsd: 12_500,
      brightBlueGetsUsd: 37_500,
    });
  });
});

describe("forecastFor", () => {
  it("calculates the base case across 2027–2029", () => {
    const forecast = forecastFor("base");
    expect(forecast.map((year) => year.year)).toEqual([2027, 2028, 2029]);
    expect(forecast.map((year) => year.placements)).toEqual([62, 146, 280]);
    expect(forecast.map((year) => year.brightBlueRevenueUsd)).toEqual([
      2_220_000, 5_190_000, 9_900_000,
    ]);
  });

  it("reconciles billings to channel earnings plus Bright.Blue revenue", () => {
    for (const scenario of ["conservative", "base", "upside"] as const) {
      for (const year of forecastFor(scenario)) {
        expect(
          year.channelEarningsUsd + year.brightBlueRevenueUsd
        ).toBe(year.customerBillingsUsd);
      }
    }
  });

  it("keeps conservative below base and upside above it", () => {
    const conservative = forecastFor("conservative");
    const base = forecastFor("base");
    const upside = forecastFor("upside");
    for (let index = 0; index < base.length; index += 1) {
      expect(conservative[index].brightBlueRevenueUsd).toBeLessThan(
        base[index].brightBlueRevenueUsd
      );
      expect(upside[index].brightBlueRevenueUsd).toBeGreaterThan(
        base[index].brightBlueRevenueUsd
      );
    }
  });
});

describe("formatCompactUsd", () => {
  it("formats forecast headlines without false precision", () => {
    expect(formatCompactUsd(2_220_000)).toBe("$2.2m");
    expect(formatCompactUsd(9_900_000)).toBe("$9.9m");
    expect(formatCompactUsd(420_000)).toBe("$420k");
  });

  it("keeps exact channel proceeds visible", () => {
    expect(formatExactUsd(6_250)).toBe("$6,250");
    expect(formatExactUsd(43_750)).toBe("$43,750");
  });
});
