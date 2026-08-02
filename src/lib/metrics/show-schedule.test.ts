import { describe, it, expect } from "vitest";

import {
  buildShowSchedule,
  countdownLabel,
  daysBetween,
  daysToDoors,
  isoToday,
} from "./show-schedule";

const TODAY = "2026-07-27";

const NOVEMBER = {
  setupDate: "2026-11-03",
  startDate: "2026-11-04",
  endDate: "2026-11-05",
  collectionDate: "2026-11-06",
  today: TODAY,
};

describe("buildShowSchedule", () => {
  it("lists install, doors, close and collection in date order", () => {
    const schedule = buildShowSchedule(NOVEMBER);

    expect(schedule.map((e) => e.id)).toEqual([
      "install",
      "doors",
      "close",
      "collection",
    ]);
  });

  it("counts the days to each date from the day passed in", () => {
    const schedule = buildShowSchedule(NOVEMBER);

    expect(schedule[0]).toMatchObject({ id: "install", daysAway: 99, state: "future" });
    expect(schedule[1]).toMatchObject({ id: "doors", daysAway: 100 });
  });

  it("skips dates the show doesn't carry rather than showing blanks", () => {
    const schedule = buildShowSchedule({ startDate: "2026-11-04", today: TODAY });

    expect(schedule.map((e) => e.id)).toEqual(["doors"]);
  });

  it("doesn't repeat the date on a single-day show", () => {
    const schedule = buildShowSchedule({
      startDate: "2026-11-04",
      endDate: "2026-11-04",
      today: TODAY,
    });

    expect(schedule.map((e) => e.id)).toEqual(["doors"]);
  });

  it("marks dates that have passed and the one happening today", () => {
    const schedule = buildShowSchedule({
      setupDate: "2026-07-26",
      startDate: "2026-07-27",
      endDate: "2026-07-28",
      today: TODAY,
    });

    expect(schedule.map((e) => e.state)).toEqual(["past", "today", "future"]);
    expect(schedule[0].daysAway).toBe(-1);
  });

  it("folds extra dated items into the same ordered strip", () => {
    const schedule = buildShowSchedule({
      ...NOVEMBER,
      extra: [
        { id: "artwork", label: "Sponsor artwork due", date: "2026-10-16" },
      ],
    });

    expect(schedule.map((e) => e.id)).toEqual([
      "artwork",
      "install",
      "doors",
      "close",
      "collection",
    ]);
  });

  it("ignores the time part of a timestamp so a date never lands a day out", () => {
    const schedule = buildShowSchedule({
      startDate: "2026-07-27T23:30:00Z",
      today: TODAY,
    });

    expect(schedule[0]).toMatchObject({ daysAway: 0, state: "today" });
  });
});

describe("daysBetween and daysToDoors", () => {
  it("counts forwards and backwards in whole days", () => {
    expect(daysBetween("2026-07-30", TODAY)).toBe(3);
    expect(daysBetween("2026-07-24", TODAY)).toBe(-3);
    expect(daysToDoors("2026-11-04", TODAY)).toBe(100);
  });

  it("returns zero for an unparseable date instead of NaN", () => {
    expect(daysBetween("not-a-date", TODAY)).toBe(0);
  });
});

describe("countdownLabel", () => {
  it("phrases the countdown the way an organizer would say it", () => {
    expect(countdownLabel(100)).toBe("Opens in 100 days");
    expect(countdownLabel(1)).toBe("Opens tomorrow");
    expect(countdownLabel(0)).toBe("Opens today");
    expect(countdownLabel(-1)).toBe("Opened yesterday");
    expect(countdownLabel(-5)).toBe("Opened 5 days ago");
  });
});

describe("isoToday", () => {
  it("returns a plain ISO date for the instant given", () => {
    expect(isoToday(new Date("2026-07-27T22:15:00Z"))).toBe("2026-07-27");
  });
});
