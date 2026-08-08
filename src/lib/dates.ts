const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split("T")[0].split("-");
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  };
}

export function formatDateShort(dateStr: string): string {
  const { day, month } = parseDate(dateStr);
  return `${day} ${MONTHS_SHORT[month]}`;
}

export function formatDateMedium(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  return `${day} ${MONTHS_SHORT[month]} ${year}`;
}

/** en-GB single date for venue partner portal, e.g. "1 Sep 2026". */
export function formatDateGB(iso: string): string {
  return formatDateMedium(iso);
}

/**
 * en-GB date range for venue partner portal.
 * Same month/year → "1–30 Sep 2026"; different months → "1 Sep – 3 Oct 2026";
 * different years → "1 Sep 2026 – 3 Jan 2027".
 */
export function formatDateRangeGB(startIso: string, endIso: string): string {
  const start = parseDate(startIso);
  const end = parseDate(endIso);

  if (start.year === end.year && start.month === end.month && start.day === end.day) {
    return formatDateGB(startIso);
  }

  const startMonth = MONTHS_SHORT[start.month];
  const endMonth = MONTHS_SHORT[end.month];

  if (start.year !== end.year) {
    return `${start.day} ${startMonth} ${start.year} – ${end.day} ${endMonth} ${end.year}`;
  }

  if (start.month !== end.month) {
    return `${start.day} ${startMonth} – ${end.day} ${endMonth} ${end.year}`;
  }

  return `${start.day}–${end.day} ${startMonth} ${end.year}`;
}

export function formatDateLong(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  const d = new Date(year, month, day);
  return `${DAYS[d.getDay()]}, ${day} ${MONTHS_LONG[month]} ${year}`;
}

export function daysUntilDate(dateStr: string): number {
  const { year, month, day } = parseDate(dateStr);
  const target = new Date(year, month, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Label + value for the event overview "Days to event" / "Wrapped" metric row. */
export function formatEventDayCount(daysToEvent: number): {
  label: string;
  value: string;
} {
  if (daysToEvent < 0) {
    const elapsed = Math.abs(daysToEvent);
    return {
      label: "Wrapped",
      value: elapsed === 1 ? "1 day ago" : `${elapsed} days ago`,
    };
  }
  if (daysToEvent === 0) {
    return { label: "Days to event", value: "Today" };
  }
  if (daysToEvent === 1) {
    return { label: "Days to event", value: "1 day" };
  }
  return { label: "Days to event", value: `${daysToEvent} days` };
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  return daysUntilDate(dateStr) < 0;
}

export function timeSince(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  const target = new Date(year, month, day);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - target.getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days}d ago`;
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

/** Human-friendly proximity label for a due date, e.g. "due in 5 days". */
export function formatDueProximity(dueDate: string): string {
  const diffDays = daysUntilDate(dueDate);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "due today";
  if (diffDays === 1) return "due tomorrow";
  return `due in ${diffDays} days`;
}

const SEVEN_DAYS_SEC = 7 * 86400;

function relativeWithinSevenDays(diffSec: number): string {
  const abs = Math.abs(diffSec);
  if (abs < 60) return "Just now";
  const mins = Math.floor(abs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(abs / 3600);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(abs / 86400);
  return `${days}d ago`;
}

/**
 * Geist time rule: relative under 7 days, absolute date beyond, exact
 * timestamp on hover via `title`.
 */
export function formatTimestamp(dateStr: string): { display: string; exact: string } {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return { display: "—", exact: "" };
  }

  const exact = parsed.toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "long",
  });

  const diffSec = Math.floor((Date.now() - parsed.getTime()) / 1000);
  if (diffSec >= 0 && diffSec < SEVEN_DAYS_SEC) {
    return { display: relativeWithinSevenDays(diffSec), exact };
  }

  const { year, month, day } = parseDate(dateStr);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return { display: "—", exact };
  }

  return { display: `${day} ${MONTHS_SHORT[month]} ${year}`, exact };
}

/**
 * Far dates render at month precision ("March 2026") because a specific day
 * would be a guess; within 30 days, exact date. Credibility rule from
 * docs/18-design-research.md R2.
 */
export function formatDateByCertainty(dateStr: string): string {
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) {
    return "—";
  }

  const days = daysUntilDate(dateStr);
  if (days > 30) {
    const { year, month } = parseDate(dateStr);
    return `${MONTHS_LONG[month]} ${year}`;
  }

  return formatDateMedium(dateStr);
}
