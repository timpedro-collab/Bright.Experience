/** Tests for the Event Wrapped story assembly. */
import { describe, it, expect } from "vitest";
import { buildWrappedStory, type WrappedInput } from "./wrapped";
import { normaliseMetrics } from "./normalise";
import type { PublicBenchmarkRow } from "@/lib/bright-index/shape";

function benchmark(
  overrides: Partial<PublicBenchmarkRow> = {}
): PublicBenchmarkRow {
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

function input(overrides: Partial<WrappedInput> = {}): WrappedInput {
  return {
    eventName: "Acme Summer Launch",
    eventType: "activation",
    eventDateStart: "2026-07-01",
    eventDateEnd: "2026-07-02",
    metrics: normaliseMetrics({ total_leads: 400, total_plays: 1000 }),
    personalNote: null,
    personalNoteAuthor: null,
    highlights: [],
    credit: "Campaign led by Sarah Whitmore",
    benchmarks: [benchmark()],
    ...overrides,
  };
}

describe("buildWrappedStory", () => {
  it("returns null when nothing was measured", () => {
    expect(
      buildWrappedStory(input({ metrics: normaliseMetrics({}) }))
    ).toBeNull();
  });

  it("leads with the headline stat and computes a top-quartile placement", () => {
    // 400 leads over 2 days = 200/day, above the p75 of 180.
    const story = buildWrappedStory(input());
    expect(story?.headline.value).toBe("400");
    expect(story?.placement?.band).toBe("top_quartile");
    expect(story?.optInLine).toBe("40% of players opted in");
  });

  it("omits the placement when benchmarks cannot credibly place the event", () => {
    const story = buildWrappedStory(input({ benchmarks: [] }));
    expect(story?.placement).toBeNull();
    expect(story?.headline.value).toBe("400");
  });

  it("prefers the personal note over highlights for the human moment", () => {
    const story = buildWrappedStory(
      input({
        personalNote: "The queue never dropped below ten people.",
        personalNoteAuthor: "Dan",
        highlights: [{ caption: "A highlight" }],
      })
    );
    expect(story?.humanMoment).toEqual({
      text: "The queue never dropped below ten people.",
      author: "Dan",
    });
  });

  it("falls back to the first captioned highlight", () => {
    const story = buildWrappedStory(
      input({ highlights: [{ url: "x" }, { caption: "Crowd three deep" }] })
    );
    expect(story?.humanMoment).toEqual({
      text: "Crowd three deep",
      author: null,
    });
  });

  it("mentions the placement in the share text only when top quartile", () => {
    const top = buildWrappedStory(input());
    expect(top?.shareText).toContain("Top 25%");

    const median = buildWrappedStory(
      input({ metrics: normaliseMetrics({ total_leads: 220, total_plays: 900 }) })
    );
    // 220 over 2 days = 110/day — above median but not top quartile.
    expect(median?.placement?.band).toBe("above_median");
    expect(median?.shareText).not.toContain("Top 25%");
  });
});
