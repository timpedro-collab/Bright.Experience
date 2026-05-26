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
  daysUntilDate,
  isOverdue,
  timeSince,
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
