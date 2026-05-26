import { describe, expect, it } from "vitest";

import {
  costPerLeadPence,
  normaliseHighlights,
  normaliseMetrics,
  normalisePredictions,
} from "./normalise";

describe("normaliseMetrics", () => {
  it("reads camelCase keys (action output)", () => {
    const m = normaliseMetrics({
      totalPlays: 1200,
      totalLeads: 360,
      totalInteractions: 1700,
      mediaImpressions: 250_000,
      totalCost: 480_000,
    });
    expect(m.totalPlays).toBe(1200);
    expect(m.totalLeads).toBe(360);
    expect(m.totalInteractions).toBe(1700);
    expect(m.mediaImpressions).toBe(250_000);
    expect(m.totalCostPence).toBe(480_000);
  });

  it("falls back to snake_case keys (seed/legacy data)", () => {
    const m = normaliseMetrics({
      total_plays: 50,
      total_leads: 12,
      media_impressions: 4200,
    });
    expect(m.totalPlays).toBe(50);
    expect(m.totalLeads).toBe(12);
    expect(m.mediaImpressions).toBe(4200);
  });

  it("returns zeros for missing/garbage input", () => {
    expect(normaliseMetrics(null).totalPlays).toBe(0);
    expect(normaliseMetrics("string").totalLeads).toBe(0);
  });

  it("parses numeric strings", () => {
    const m = normaliseMetrics({ totalPlays: "42" });
    expect(m.totalPlays).toBe(42);
  });
});

describe("normalisePredictions", () => {
  it("reads camelCase keys", () => {
    const p = normalisePredictions({
      estimatedInteractions: 2000,
      estimatedLeads: 500,
      estimatedImpressions: 100_000,
    });
    expect(p.estimatedInteractions).toBe(2000);
    expect(p.estimatedLeads).toBe(500);
    expect(p.estimatedImpressions).toBe(100_000);
  });

  it("falls back to raw.* (outcome_estimates_json shape)", () => {
    const p = normalisePredictions({
      raw: { interactions: 800, leads: 200, impressions: 40_000 },
    });
    expect(p.estimatedInteractions).toBe(800);
    expect(p.estimatedLeads).toBe(200);
    expect(p.estimatedImpressions).toBe(40_000);
  });

  it("returns nulls when missing so renderers can hide the section", () => {
    const p = normalisePredictions({});
    expect(p.estimatedInteractions).toBeNull();
    expect(p.estimatedLeads).toBeNull();
    expect(p.estimatedImpressions).toBeNull();
  });
});

describe("costPerLeadPence", () => {
  it("calculates pence per lead", () => {
    const cpl = costPerLeadPence(normaliseMetrics({ totalCost: 60_000, totalLeads: 100 }));
    expect(cpl).toBe(600);
  });

  it("returns null when there are no leads", () => {
    expect(costPerLeadPence(normaliseMetrics({ totalCost: 60_000, totalLeads: 0 }))).toBeNull();
  });
});

describe("normaliseHighlights", () => {
  it("passes canonical shape through", () => {
    const out = normaliseHighlights([
      { url: "/a.jpg", caption: "A", stat: "+12%" },
      { url: "/b.jpg" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].caption).toBe("A");
    expect(out[1].url).toBe("/b.jpg");
  });

  it("treats bare strings as captions", () => {
    const out = normaliseHighlights(["Crowd shot", "Winner moment"]);
    expect(out).toHaveLength(2);
    expect(out[0].caption).toBe("Crowd shot");
    expect(out[0].url).toBeUndefined();
  });

  it("filters non-array input", () => {
    expect(normaliseHighlights(null)).toEqual([]);
    expect(normaliseHighlights({})).toEqual([]);
  });

  it("drops entries that are neither string nor object", () => {
    const out = normaliseHighlights(["ok", 42, null, { caption: "c" }]);
    expect(out).toHaveLength(2);
  });
});
