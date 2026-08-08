/** Tests for the loop-pulse dashboard maths. */
import { describe, it, expect } from "vitest";

import {
  medianDurationHours,
  formatHours,
  ratePct,
  formatPct,
  artifactLabel,
  buildInvitationRows,
} from "./loop-pulse";

const HOUR = 3_600_000;

describe("medianDurationHours", () => {
  it("returns null when there are no durations", () => {
    expect(medianDurationHours([])).toBeNull();
  });

  it("takes the middle value for odd-length lists", () => {
    expect(medianDurationHours([1 * HOUR, 5 * HOUR, 100 * HOUR])).toBe(5);
  });

  it("averages the middle pair for even-length lists", () => {
    expect(medianDurationHours([2 * HOUR, 4 * HOUR])).toBe(3);
  });

  it("ignores negative and non-finite durations", () => {
    expect(medianDurationHours([-5 * HOUR, NaN, 3 * HOUR])).toBe(3);
  });
});

describe("formatHours", () => {
  it("renders a dash for null", () => {
    expect(formatHours(null)).toBe("—");
  });

  it("uses minutes under an hour", () => {
    expect(formatHours(0.5)).toBe("30 min");
  });

  it("never rounds a tiny duration down to zero minutes", () => {
    expect(formatHours(0.001)).toBe("1 min");
  });

  it("uses one decimal for short hour spans and none for long ones", () => {
    expect(formatHours(3.24)).toBe("3.2 h");
    expect(formatHours(14.6)).toBe("15 h");
  });

  it("switches to days from 48 hours", () => {
    expect(formatHours(50)).toBe("2.1 days");
  });
});

describe("ratePct", () => {
  it("returns null instead of a fake 0% when the denominator is zero", () => {
    expect(ratePct(0, 0)).toBeNull();
  });

  it("rounds to whole percent", () => {
    expect(ratePct(1, 3)).toBe(33);
  });
});

describe("formatPct", () => {
  it("prints a dash for no-data", () => {
    expect(formatPct(null)).toBe("—");
  });

  it("prints the percentage", () => {
    expect(formatPct(62)).toBe("62%");
  });
});

describe("artifactLabel", () => {
  it("maps known artifacts to display names", () => {
    expect(artifactLabel("report")).toBe("Public report");
    expect(artifactLabel("player_card")).toBe("Player result card");
  });

  it("passes unknown artifacts through unchanged", () => {
    expect(artifactLabel("mystery")).toBe("mystery");
  });
});

describe("buildInvitationRows", () => {
  it("computes CTR only for artifacts with a tracked denominator", () => {
    const rows = buildInvitationRows(
      { report: 6, live: 2 },
      { report: 30 },
    );
    const report = rows.find((r) => r.artifact === "report")!;
    expect(report.ctrPct).toBe(20);
    expect(report.views).toBe(30);

    const live = rows.find((r) => r.artifact === "live")!;
    expect(live.ctrPct).toBeNull();
    expect(live.views).toBeNull();
  });

  it("includes artifacts that have views but no landings yet", () => {
    const rows = buildInvitationRows({}, { player_card: 12 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      artifact: "player_card",
      landings: 0,
      views: 12,
      ctrPct: 0,
    });
  });

  it("sorts by landings, busiest first", () => {
    const rows = buildInvitationRows({ live: 1, report: 9 }, {});
    expect(rows.map((r) => r.artifact)).toEqual(["report", "live"]);
  });
});
