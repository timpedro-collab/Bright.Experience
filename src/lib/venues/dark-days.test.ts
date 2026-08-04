/** Tests for dark-day gap detection on venue placements. */
import { describe, it, expect } from "vitest";

import {
  darkDayGaps,
  totalDarkDays,
  gapValuePence,
  DARK_DAY_HORIZON_DAYS,
} from "./dark-days";

const TODAY = new Date("2026-08-01T12:00:00Z");

describe("darkDayGaps", () => {
  it("finds the uncovered run between two slots", () => {
    const gaps = darkDayGaps(
      "2026-08-01",
      "2026-08-31",
      [
        { start_date: "2026-08-01", end_date: "2026-08-10" },
        { start_date: "2026-08-21", end_date: "2026-08-31" },
      ],
      TODAY,
    );

    expect(gaps).toEqual([{ start: "2026-08-11", end: "2026-08-20", days: 10 }]);
  });

  it("reads a placement with no slots as one long gap", () => {
    const gaps = darkDayGaps("2026-08-01", "2026-08-07", [], TODAY);
    expect(gaps).toEqual([{ start: "2026-08-01", end: "2026-08-07", days: 7 }]);
  });

  it("ignores days already behind us", () => {
    const gaps = darkDayGaps("2026-07-01", "2026-08-05", [], TODAY);
    expect(gaps).toEqual([{ start: "2026-08-01", end: "2026-08-05", days: 5 }]);
  });

  it("counts an unsold available slot as cover — it's already on the market", () => {
    const gaps = darkDayGaps(
      "2026-08-01",
      "2026-08-10",
      [{ start_date: "2026-08-01", end_date: "2026-08-10" }],
      TODAY,
    );
    expect(gaps).toEqual([]);
  });

  it("caps an open-ended placement at the scan horizon", () => {
    const gaps = darkDayGaps("2026-08-01", null, [], TODAY);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].days).toBe(DARK_DAY_HORIZON_DAYS + 1);
  });

  it("returns nothing once the placement window has closed", () => {
    expect(darkDayGaps("2026-06-01", "2026-07-15", [], TODAY)).toEqual([]);
  });
});

describe("totalDarkDays", () => {
  it("sums the days across gaps", () => {
    expect(
      totalDarkDays([
        { start: "2026-08-11", end: "2026-08-20", days: 10 },
        { start: "2026-09-01", end: "2026-09-03", days: 3 },
      ]),
    ).toBe(13);
  });
});

describe("gapValuePence", () => {
  it("prices a gap at the day rate", () => {
    expect(
      gapValuePence({ start: "2026-08-11", end: "2026-08-20", days: 10 }, 50_000),
    ).toBe(500_000);
  });

  it("returns null without a usable day rate", () => {
    const gap = { start: "2026-08-11", end: "2026-08-20", days: 10 };
    expect(gapValuePence(gap, null)).toBeNull();
    expect(gapValuePence(gap, 0)).toBeNull();
  });
});
