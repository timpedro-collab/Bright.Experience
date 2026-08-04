import { describe, it, expect } from "vitest";

import { compareToLastEvent, compareToVenueClass } from "./benchmark-compare";

describe("compareToLastEvent", () => {
  it("marks metrics above, below, and level vs the prior event", () => {
    const verdicts = compareToLastEvent(
      { plays: 122, leads: 48, dwellSeconds: 98 },
      { plays: 100, leads: 50, dwellSeconds: 100 },
    );

    expect(verdicts).toHaveLength(3);
    expect(verdicts[0]).toMatchObject({
      metric: "plays",
      direction: "above",
      deltaPct: 22,
      sentence: "22% above your last event",
    });
    expect(verdicts[1]).toMatchObject({
      metric: "leads",
      direction: "level",
      deltaPct: -4,
      sentence: "Level with your last event",
    });
    expect(verdicts[2]).toMatchObject({
      metric: "dwell",
      direction: "level",
      deltaPct: -2,
      sentence: "Level with your last event",
    });
  });

  it("skips metrics when the prior event reference is zero", () => {
    const verdicts = compareToLastEvent(
      { plays: 50, leads: 10, dwellSeconds: 30 },
      { plays: 0, leads: 0, dwellSeconds: 0 },
    );

    expect(verdicts).toHaveLength(0);
  });

  it("rounds delta percentages to whole numbers", () => {
    const verdicts = compareToLastEvent(
      { plays: 101, leads: 10, dwellSeconds: 30 },
      { plays: 100, leads: 0, dwellSeconds: 0 },
    );

    expect(verdicts).toHaveLength(1);
    expect(verdicts[0]?.deltaPct).toBe(1);
    expect(verdicts[0]?.metric).toBe("plays");
  });
});

describe("compareToVenueClass", () => {
  it("compares per-day rates against venue-class medians", () => {
    const verdicts = compareToVenueClass(
      { playsPerDay: 305, leadsPerDay: 180 },
      { playsPerDay: 250, leadsPerDay: 200 },
    );

    expect(verdicts).toHaveLength(2);
    expect(verdicts[0]).toMatchObject({
      metric: "plays",
      direction: "above",
      deltaPct: 22,
      sentence: "22% above the venue-class median",
    });
    expect(verdicts[1]).toMatchObject({
      metric: "leads",
      direction: "below",
      deltaPct: -10,
      sentence: "10% below the venue-class median",
    });
  });

  it("skips metrics whose median is null", () => {
    const verdicts = compareToVenueClass(
      { playsPerDay: 100, leadsPerDay: 50 },
      { playsPerDay: 80, leadsPerDay: null },
    );

    expect(verdicts).toHaveLength(1);
    expect(verdicts[0]?.metric).toBe("plays");
  });

  it("skips metrics when the median reference is zero", () => {
    const verdicts = compareToVenueClass(
      { playsPerDay: 100, leadsPerDay: 50 },
      { playsPerDay: 0, leadsPerDay: 10 },
    );

    expect(verdicts).toHaveLength(1);
    expect(verdicts[0]?.metric).toBe("leads");
  });

  it("treats small deltas as level with the venue-class median", () => {
    const verdicts = compareToVenueClass(
      { playsPerDay: 103, leadsPerDay: 0 },
      { playsPerDay: 100, leadsPerDay: null },
    );

    expect(verdicts[0]).toMatchObject({
      direction: "level",
      sentence: "Level with the venue-class median",
    });
  });
});
