/** Tests for the Bright Index shaping helpers. */
import { describe, it, expect } from "vitest";

import {
  MIN_PUBLISHABLE_SAMPLE,
  isPublishable,
  shapeIndex,
  tierLabel,
  eventTypeLabel,
  indexFreshness,
  indexSampleTotal,
  type PublicBenchmarkRow,
} from "./shape";

function row(overrides: Partial<PublicBenchmarkRow> = {}): PublicBenchmarkRow {
  return {
    eventType: "activation",
    locationTier: "tier_1",
    machineType: "Bright.Play",
    metricName: "plays_per_day",
    medianValue: 270,
    p25Value: 250,
    p75Value: 300,
    sampleSize: 28,
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

describe("isPublishable", () => {
  it("publishes a healthy row", () => {
    expect(isPublishable(row())).toBe(true);
  });

  it("suppresses rows below the sample floor", () => {
    expect(isPublishable(row({ sampleSize: MIN_PUBLISHABLE_SAMPLE - 1 }))).toBe(
      false
    );
  });

  it("suppresses rows with no median", () => {
    expect(isPublishable(row({ medianValue: null }))).toBe(false);
  });

  it("suppresses metrics the Index does not publish", () => {
    expect(isPublishable(row({ metricName: "total_plays" }))).toBe(false);
  });
});

describe("labels", () => {
  it("maps known tiers and the all-venues aggregate", () => {
    expect(tierLabel("tier_1")).toBe("Premium venues");
    expect(tierLabel(null)).toBe("All venue classes");
  });

  it("passes unknown tiers through rather than guessing", () => {
    expect(tierLabel("tier_9")).toBe("tier_9");
  });

  it("capitalises unknown event types", () => {
    expect(eventTypeLabel("roadshow")).toBe("Roadshow");
    expect(eventTypeLabel("activation")).toBe("Brand activations");
  });
});

describe("shapeIndex", () => {
  it("groups by event type with activations first and tiers premium-first", () => {
    const sections = shapeIndex([
      row({ eventType: "sampling", metricName: "samples_per_day" }),
      row({ locationTier: "tier_2", medianValue: 200 }),
      row({ locationTier: "tier_1", medianValue: 270 }),
      row({ locationTier: null, medianValue: 235 }),
    ]);

    expect(sections.map((s) => s.eventType)).toEqual([
      "activation",
      "sampling",
    ]);
    const plays = sections[0].metrics[0];
    expect(plays.entries.map((e) => e.tier)).toEqual([
      "tier_1",
      "tier_2",
      null,
    ]);
  });

  it("drops sections whose every row is unpublishable", () => {
    const sections = shapeIndex([
      row({ eventType: "conference", sampleSize: 2 }),
      row({ eventType: "activation" }),
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0].eventType).toBe("activation");
  });

  it("keeps metric order canonical (plays before leads before dwell)", () => {
    const sections = shapeIndex([
      row({ metricName: "avg_dwell_time", medianValue: 48 }),
      row({ metricName: "leads_per_day", medianValue: 208 }),
      row({ metricName: "plays_per_day" }),
    ]);
    expect(sections[0].metrics.map((m) => m.metricName)).toEqual([
      "plays_per_day",
      "leads_per_day",
      "avg_dwell_time",
    ]);
  });

  it("returns an empty array for no input", () => {
    expect(shapeIndex([])).toEqual([]);
  });
});

describe("freshness and sample totals", () => {
  it("returns the latest updated_at across publishable rows only", () => {
    expect(
      indexFreshness([
        row({ updatedAt: "2026-07-01T00:00:00Z" }),
        row({ updatedAt: "2026-08-02T00:00:00Z" }),
        row({ updatedAt: "2026-09-01T00:00:00Z", sampleSize: 1 }),
      ])
    ).toBe("2026-08-02T00:00:00Z");
  });

  it("returns null when nothing is publishable", () => {
    expect(indexFreshness([row({ sampleSize: 0 })])).toBeNull();
  });

  it("sums the per-section maximum sample, not every row", () => {
    const sections = shapeIndex([
      row({ sampleSize: 28 }),
      row({ metricName: "leads_per_day", sampleSize: 28 }),
      row({ eventType: "sampling", metricName: "samples_per_day", sampleSize: 22 }),
    ]);
    expect(indexSampleTotal(sections)).toBe(50);
  });
});
