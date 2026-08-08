/** Tests for Bright Index placement — bands, badge eligibility, row selection. */
import { describe, it, expect } from "vitest";
import {
  computeIndexPlacement,
  pickComparisonRow,
  quarterLabel,
} from "./percentile";
import type { PublicBenchmarkRow } from "./shape";

function row(overrides: Partial<PublicBenchmarkRow> = {}): PublicBenchmarkRow {
  return {
    eventType: "activation",
    locationTier: null,
    machineType: null,
    metricName: "leads_per_day",
    medianValue: 100,
    p25Value: 60,
    p75Value: 180,
    sampleSize: 12,
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

const opts = {
  subjectLabel: "brand activations",
  metricLabel: "opted-in leads per day",
  when: new Date("2026-08-07T00:00:00Z"),
};

describe("quarterLabel", () => {
  it("labels each quarter correctly", () => {
    expect(quarterLabel(new Date("2026-01-15T00:00:00Z"))).toBe("Q1 2026");
    expect(quarterLabel(new Date("2026-08-07T00:00:00Z"))).toBe("Q3 2026");
    expect(quarterLabel(new Date("2026-12-31T00:00:00Z"))).toBe("Q4 2026");
  });
});

describe("pickComparisonRow", () => {
  it("prefers the all-venues aggregate row", () => {
    const tierRow = row({ locationTier: "tier_1", sampleSize: 30 });
    const aggregate = row({ sampleSize: 10 });
    expect(
      pickComparisonRow([tierRow, aggregate], {
        eventType: "activation",
        metricName: "leads_per_day",
      })
    ).toBe(aggregate);
  });

  it("falls back to the largest publishable sample when no aggregate exists", () => {
    const small = row({ locationTier: "tier_2", sampleSize: 6 });
    const large = row({ locationTier: "tier_1", sampleSize: 20 });
    expect(
      pickComparisonRow([small, large], {
        eventType: "activation",
        metricName: "leads_per_day",
      })
    ).toBe(large);
  });

  it("returns null when nothing matches event type, metric, or the sample floor", () => {
    expect(
      pickComparisonRow(
        [
          row({ eventType: "sampling" }),
          row({ metricName: "plays_per_day" }),
          row({ sampleSize: 3 }),
        ],
        { eventType: "activation", metricName: "leads_per_day" }
      )
    ).toBeNull();
  });
});

describe("computeIndexPlacement", () => {
  it("awards the top-quartile badge at or above p75", () => {
    const placement = computeIndexPlacement(180, row(), opts);
    expect(placement?.band).toBe("top_quartile");
    expect(placement?.badge).toBe("Top-Quartile Activation · Q3 2026");
    expect(placement?.label).toContain("Top 25% of brand activations");
    expect(placement?.sampleSize).toBe(12);
  });

  it("places above-median values without a badge", () => {
    const placement = computeIndexPlacement(120, row(), opts);
    expect(placement?.band).toBe("above_median");
    expect(placement?.badge).toBeNull();
  });

  it("places values between p25 and median in the typical range", () => {
    expect(computeIndexPlacement(70, row(), opts)?.band).toBe("below_median");
  });

  it("places values under p25 below the typical range", () => {
    expect(computeIndexPlacement(10, row(), opts)?.band).toBe(
      "bottom_quartile"
    );
  });

  it("refuses to place zero, thin samples, or a missing row", () => {
    expect(computeIndexPlacement(0, row(), opts)).toBeNull();
    expect(
      computeIndexPlacement(100, row({ sampleSize: 4 }), opts)
    ).toBeNull();
    expect(computeIndexPlacement(100, null, opts)).toBeNull();
    expect(
      computeIndexPlacement(100, row({ medianValue: null }), opts)
    ).toBeNull();
  });
});
