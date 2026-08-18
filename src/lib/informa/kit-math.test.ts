import { describe, expect, it } from "vitest";

import {
  cplPosition,
  formatCount,
  formatUsdWhole,
  placementValue,
} from "./kit-math";

describe("placementValue", () => {
  it("caps plays at the machine's daily throughput, not raw attendance", () => {
    const v = placementValue({ attendees: 50_000, days: 3, priceUsd: 20_000 });
    expect(v.playsHigh).toBe(220 * 3);
    expect(v.playsLow).toBeLessThan(v.playsHigh);
  });

  it("lets a small audience bound plays below the throughput cap", () => {
    const v = placementValue({ attendees: 300, days: 3, priceUsd: 10_000 });
    expect(v.playsHigh).toBe(300);
  });

  it("scales impressions off attendees across three screens", () => {
    const v = placementValue({ attendees: 3_000, days: 3, priceUsd: 18_000 });
    expect(v.impressions).toBe(9_000);
  });

  it("keeps the lead range inside the play range", () => {
    const v = placementValue({ attendees: 3_000, days: 3, priceUsd: 18_000 });
    expect(v.leadsHigh).toBeLessThanOrEqual(v.playsHigh);
    expect(v.leadsLow).toBeLessThanOrEqual(v.playsLow);
    expect(v.leadsLow).toBeGreaterThan(0);
  });

  it("prices cost per lead off the price and the lead band, cheapest first", () => {
    const v = placementValue({ attendees: 3_000, days: 3, priceUsd: 18_000 });
    expect(v.costPerLeadLow).not.toBeNull();
    expect(v.costPerLeadHigh).not.toBeNull();
    expect(v.costPerLeadLow!).toBeLessThanOrEqual(v.costPerLeadHigh!);
  });

  it("returns null unit costs when the price is zero", () => {
    const v = placementValue({ attendees: 3_000, days: 3, priceUsd: 0 });
    expect(v.costPerLeadLow).toBeNull();
    expect(v.costPerPlayHigh).toBeNull();
  });

  it("survives zero attendees without dividing by zero", () => {
    const v = placementValue({ attendees: 0, days: 2, priceUsd: 15_000 });
    expect(v.impressions).toBe(0);
    expect(v.playsHigh).toBe(0);
    expect(v.costPerLeadLow).toBeNull();
  });
});

describe("cplPosition", () => {
  it("reports below when the whole range is under the benchmark band", () => {
    expect(cplPosition(60, 90)).toBe("below");
  });

  it("reports level when the range overlaps the benchmark band", () => {
    expect(cplPosition(100, 150)).toBe("level");
    expect(cplPosition(120, 200)).toBe("level");
  });

  it("reports above when the whole range is over the benchmark band", () => {
    expect(cplPosition(200, 320)).toBe("above");
  });

  it("returns null when there is no lead range to compare", () => {
    expect(cplPosition(null, null)).toBeNull();
    expect(cplPosition(50, null)).toBeNull();
  });
});

describe("formatters", () => {
  it("formats counts with thousands separators", () => {
    expect(formatCount(12_400)).toBe("12,400");
  });

  it("formats whole-dollar USD", () => {
    expect(formatUsdWhole(18_000)).toBe("$18,000");
    expect(formatUsdWhole(29)).toBe("$29");
  });
});
