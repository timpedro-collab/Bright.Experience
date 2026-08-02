import { describe, it, expect } from "vitest";

import {
  buildExpectation,
  expectationBasisLabel,
  formatRange,
  showDayCount,
  type BenchmarkInput,
} from "./expected-performance";

const ROWS: BenchmarkInput[] = [
  {
    metricName: "plays_per_day",
    eventType: "activation",
    machineType: "Bright.Play",
    medianValue: 270,
    avgValue: 275,
    p25Value: 250,
    p75Value: 300,
    sampleSize: 28,
  },
  {
    metricName: "plays_per_day",
    eventType: "activation",
    machineType: "Bright.Play",
    medianValue: 200,
    avgValue: 205,
    p25Value: 175,
    p75Value: 235,
    sampleSize: 19,
  },
  {
    metricName: "plays_per_day",
    eventType: "sampling",
    machineType: "Bright.Vend Pro",
    p25Value: 500,
    p75Value: 600,
    sampleSize: 9,
  },
  {
    metricName: "leads_per_day",
    eventType: "activation",
    machineType: "Bright.Play",
    p25Value: 185,
    p75Value: 240,
    sampleSize: 28,
  },
];

describe("buildExpectation", () => {
  it("merges every matching tier into one range and pools the sample", () => {
    const expectation = buildExpectation(ROWS, {
      metric: "plays",
      eventType: "activation",
      machineType: "Bright.Play",
    });

    expect(expectation).toMatchObject({
      metric: "plays",
      perDayLow: 175,
      perDayHigh: 300,
      sampleSize: 47,
      basis: "machine",
    });
  });

  it("multiplies the daily range out across the length of the show", () => {
    const expectation = buildExpectation(ROWS, {
      metric: "plays",
      eventType: "activation",
      machineType: "Bright.Play",
      days: 3,
    });

    expect(expectation?.totalLow).toBe(525);
    expect(expectation?.totalHigh).toBe(900);
  });

  it("ignores benchmarks for a different event type", () => {
    const expectation = buildExpectation(ROWS, {
      metric: "plays",
      eventType: "sampling",
      machineType: "Bright.Vend Pro",
    });

    expect(expectation?.perDayLow).toBe(500);
    expect(expectation?.sampleSize).toBe(9);
  });

  it("falls back to the event type when no row matches the machine", () => {
    const expectation = buildExpectation(ROWS, {
      metric: "plays",
      eventType: "activation",
      machineType: "Some Unlisted Portal",
    });

    expect(expectation?.basis).toBe("event");
    expect(expectation?.perDayLow).toBe(175);
  });

  it("returns nothing rather than a guess when no benchmark comes close", () => {
    expect(
      buildExpectation(ROWS, { metric: "plays", eventType: "conference" })
    ).toBeNull();
    expect(
      buildExpectation([], { metric: "leads", eventType: "activation" })
    ).toBeNull();
  });

  it("falls back to the midpoint when a row carries no percentiles", () => {
    const expectation = buildExpectation(
      [
        {
          metricName: "plays_per_day",
          eventType: "activation",
          medianValue: 180,
          sampleSize: 4,
        },
      ],
      { metric: "plays", eventType: "activation" }
    );

    expect(expectation).toMatchObject({ perDayLow: 180, perDayHigh: 180 });
  });

  it("skips rows with no usable numbers at all", () => {
    const expectation = buildExpectation(
      [{ metricName: "plays_per_day", eventType: "activation", sampleSize: 3 }],
      { metric: "plays", eventType: "activation" }
    );

    expect(expectation).toBeNull();
  });

  it("reads leads from their own metric, not from plays", () => {
    const expectation = buildExpectation(ROWS, {
      metric: "leads",
      eventType: "activation",
      machineType: "Bright.Play",
    });

    expect(expectation).toMatchObject({ perDayLow: 185, perDayHigh: 240 });
  });
});

describe("formatRange", () => {
  it("writes a spread as a range and a flat value as one number", () => {
    expect(formatRange(250, 300)).toBe("250–300");
    expect(formatRange(180, 180)).toBe("180");
    expect(formatRange(1200, 1800)).toBe("1,200–1,800");
  });
});

describe("expectationBasisLabel", () => {
  it("says whether the match was on the machine or only the event type", () => {
    const machine = buildExpectation(ROWS, {
      metric: "plays",
      eventType: "activation",
      machineType: "Bright.Play",
    })!;
    expect(expectationBasisLabel(machine)).toBe(
      "Based on 47 comparable activations with this machine"
    );

    const event = buildExpectation(ROWS, {
      metric: "plays",
      eventType: "activation",
      machineType: "Unlisted",
    })!;
    expect(expectationBasisLabel(event)).toBe(
      "Based on 47 comparable activations of this type"
    );
  });

  it("uses the singular for a sample of one", () => {
    const single = buildExpectation(
      [
        {
          metricName: "plays_per_day",
          eventType: "activation",
          p25Value: 100,
          p75Value: 120,
          sampleSize: 1,
        },
      ],
      { metric: "plays", eventType: "activation" }
    )!;
    expect(expectationBasisLabel(single)).toBe("Based on 1 comparable activation of this type");
  });
});

describe("showDayCount", () => {
  it("counts both the first and the last day", () => {
    expect(showDayCount("2026-11-04", "2026-11-05")).toBe(2);
    expect(showDayCount("2026-06-17", "2026-06-19")).toBe(3);
  });

  it("treats a show with no end date as a single day", () => {
    expect(showDayCount("2026-11-04")).toBe(1);
    expect(showDayCount("2026-11-04", null)).toBe(1);
  });

  it("never returns less than a day for a back-to-front range", () => {
    expect(showDayCount("2026-11-05", "2026-11-04")).toBe(1);
  });
});
