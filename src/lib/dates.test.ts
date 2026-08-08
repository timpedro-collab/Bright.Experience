/**
 * Tests for the small date helpers shared across the portal.
 *
 * `daysUntilDate` and `timeSince` read the current date, so we use
 * Vitest's fake-timer support to pin "now" to a known value. Otherwise
 * the tests would be flaky on day boundaries.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatDateShort,
  formatDateMedium,
  formatDateLong,
  formatDateGB,
  formatDateRangeGB,
  daysUntilDate,
  formatEventDayCount,
  isOverdue,
  timeSince,
  formatTimestamp,
  formatDateByCertainty,
} from "./dates";

describe("formatDateShort", () => {
  it("formats ISO date string as 'D Mon'", () => {
    expect(formatDateShort("2026-06-05")).toBe("5 Jun");
  });

  it("strips the time portion of an ISO datetime", () => {
    expect(formatDateShort("2026-12-31T23:59:00Z")).toBe("31 Dec");
  });

  it("handles single-digit months", () => {
    expect(formatDateShort("2026-01-15")).toBe("15 Jan");
  });
});

describe("formatDateMedium", () => {
  it("includes the year", () => {
    expect(formatDateMedium("2026-06-05")).toBe("5 Jun 2026");
  });
});

describe("formatDateGB", () => {
  it("formats ISO date as en-GB day month year", () => {
    expect(formatDateGB("2026-09-01")).toBe("1 Sep 2026");
  });
});

describe("formatDateRangeGB", () => {
  it("collapses same month and year", () => {
    expect(formatDateRangeGB("2026-09-01", "2026-09-30")).toBe("1–30 Sep 2026");
  });

  it("shows both months when year matches", () => {
    expect(formatDateRangeGB("2026-09-01", "2026-10-03")).toBe("1 Sep – 3 Oct 2026");
  });

  it("shows both years when they differ", () => {
    expect(formatDateRangeGB("2026-09-01", "2027-01-03")).toBe(
      "1 Sep 2026 – 3 Jan 2027",
    );
  });

  it("returns a single date when start and end match", () => {
    expect(formatDateRangeGB("2026-08-20", "2026-08-20")).toBe("20 Aug 2026");
  });
});

describe("formatDateLong", () => {
  it("includes weekday and full month name", () => {
    // 2026-06-05 is a Friday
    expect(formatDateLong("2026-06-05")).toBe("Fri, 5 June 2026");
  });
});

describe("daysUntilDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin "now" to mid-day on 2026-06-01 (Monday)
    vi.setSystemTime(new Date(2026, 5, 1, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("returns positive days for future dates", () => {
    expect(daysUntilDate("2026-06-15")).toBe(14);
  });

  it("returns 0 for today", () => {
    expect(daysUntilDate("2026-06-01")).toBe(0);
  });

  it("returns negative days for past dates", () => {
    expect(daysUntilDate("2026-05-30")).toBe(-2);
  });
});

describe("formatEventDayCount", () => {
  it("labels future events and pluralises day counts", () => {
    expect(formatEventDayCount(12)).toEqual({
      label: "Days to event",
      value: "12 days",
    });
  });

  it("handles today and a single future day", () => {
    expect(formatEventDayCount(0)).toEqual({
      label: "Days to event",
      value: "Today",
    });
    expect(formatEventDayCount(1)).toEqual({
      label: "Days to event",
      value: "1 day",
    });
  });

  it("labels past events as Wrapped with days ago copy", () => {
    expect(formatEventDayCount(-140)).toEqual({
      label: "Wrapped",
      value: "140 days ago",
    });
    expect(formatEventDayCount(-1)).toEqual({
      label: "Wrapped",
      value: "1 day ago",
    });
  });
});

describe("isOverdue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("returns false for undefined", () => {
    expect(isOverdue(undefined)).toBe(false);
  });

  it("returns true for past dates", () => {
    expect(isOverdue("2026-05-01")).toBe(true);
  });

  it("returns false for today", () => {
    expect(isOverdue("2026-06-01")).toBe(false);
  });

  it("returns false for future dates", () => {
    expect(isOverdue("2026-06-30")).toBe(false);
  });
});

describe("timeSince", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin to 2026-06-10 09:00
    vi.setSystemTime(new Date(2026, 5, 10, 9, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("returns 'Xd ago' for days in the past", () => {
    // parseDate strips time so "2026-06-07" → 7 Jun midnight → ~3 days back
    expect(timeSince("2026-06-07")).toBe("3d ago");
  });

  it("returns 'Xh ago' when less than a day", () => {
    // 2026-06-10 (no time) is midnight → 9h ago at 09:00
    expect(timeSince("2026-06-10")).toBe("9h ago");
  });

  it("returns 'Just now' for the immediate present", () => {
    // Set to a time within the current hour
    vi.setSystemTime(new Date(2026, 5, 10, 0, 30, 0));
    expect(timeSince("2026-06-10")).toBe("Just now");
  });
});

describe("formatTimestamp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("returns 2m ago for two minutes in the past", () => {
    const twoMinAgo = new Date(2026, 2, 14, 11, 58, 0).toISOString();
    expect(formatTimestamp(twoMinAgo).display).toBe("2m ago");
    expect(formatTimestamp(twoMinAgo).exact).toBeTruthy();
  });

  it("returns 3d ago for three days in the past", () => {
    expect(formatTimestamp("2026-03-11T09:00:00Z").display).toBe("3d ago");
  });

  it("returns an absolute date beyond seven days", () => {
    expect(formatTimestamp("2026-03-01T09:00:00Z").display).toBe("1 Mar 2026");
  });

  it("returns an em-dash for an invalid string", () => {
    expect(formatTimestamp("not-a-date")).toEqual({ display: "—", exact: "" });
  });
});

describe("formatDateByCertainty", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 14, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("uses month precision when more than 30 days out", () => {
    expect(formatDateByCertainty("2026-05-01")).toBe("May 2026");
  });

  it("uses an exact date within 30 days", () => {
    expect(formatDateByCertainty("2026-03-25")).toBe("25 Mar 2026");
  });

  it("returns an em-dash for invalid input", () => {
    expect(formatDateByCertainty("bad-date")).toBe("—");
  });
});
