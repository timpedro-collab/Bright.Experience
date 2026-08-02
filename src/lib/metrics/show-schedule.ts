/**
 * The dated spine of a show: install, doors, close, collection.
 *
 * Exhibition teams plan backwards from move-in, not forwards from today, and
 * every one of these dates is already on the `events` row — we simply never
 * showed them to the organizer running the floor. Surfacing them as one strip
 * with a countdown is the difference between a portal you check and a portal
 * you check *for* something.
 *
 * Only dates the system actually holds appear here. Nothing is inferred: an
 * invented "artwork locks 14 days out" would be a business rule nobody agreed,
 * and the first time it disagreed with an email from ops, the portal would
 * stop being the source of truth.
 */

const DAY_MS = 86_400_000;

/** Where a dated entry sits relative to today. */
export type ScheduleState = "past" | "today" | "future";

export interface ScheduleEntry {
  id: string;
  label: string;
  date: string;
  /** Optional one-liner explaining what happens on the day. */
  hint?: string;
  state: ScheduleState;
  /** Whole days from today. Negative once the date has passed. */
  daysAway: number;
}

/** A dated item beyond the four fixed ones, e.g. an artwork deadline. */
export interface ExtraScheduleEntry {
  id: string;
  label: string;
  date: string;
  hint?: string;
}

export interface ShowScheduleInput {
  setupDate?: string | null;
  startDate: string;
  endDate?: string | null;
  collectionDate?: string | null;
  extra?: ExtraScheduleEntry[];
  /** ISO date, injected so a render never reads the clock. */
  today?: string;
}

/** Midnight-UTC epoch for an ISO date or datetime, ignoring any time part. */
function dayEpoch(value: string): number {
  return Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
}

/** Whole days from `today` to `date`; negative once the date has passed. */
export function daysBetween(date: string, today: string = isoToday()): number {
  const from = dayEpoch(today);
  const to = dayEpoch(date);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / DAY_MS);
}

/** Today as an ISO date. The single place a schedule reads the clock. */
export function isoToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function stateFor(daysAway: number): ScheduleState {
  if (daysAway < 0) return "past";
  if (daysAway === 0) return "today";
  return "future";
}

/**
 * The show's key dates in order, skipping any the event doesn't carry. A show
 * with no install date recorded simply starts at "doors open" rather than
 * showing an empty row the organizer can't act on.
 */
export function buildShowSchedule(input: ShowScheduleInput): ScheduleEntry[] {
  const { setupDate, startDate, endDate, collectionDate, extra = [] } = input;
  const today = input.today ?? isoToday();

  const raw: ExtraScheduleEntry[] = [];
  if (setupDate) {
    raw.push({
      id: "install",
      label: "Install",
      date: setupDate,
      hint: "Our crew places and tests every unit.",
    });
  }
  raw.push({
    id: "doors",
    label: "Doors open",
    date: startDate,
    hint: "Machines go live and results start arriving.",
  });
  // A single-day show would otherwise list the same date twice.
  if (endDate && dayEpoch(endDate) > dayEpoch(startDate)) {
    raw.push({ id: "close", label: "Show closes", date: endDate });
  }
  if (collectionDate) {
    raw.push({
      id: "collection",
      label: "Collection",
      date: collectionDate,
      hint: "Units come out and the final report is prepared.",
    });
  }
  raw.push(...extra);

  return raw
    .map((entry) => {
      const daysAway = daysBetween(entry.date, today);
      return { ...entry, daysAway, state: stateFor(daysAway) };
    })
    .sort((a, b) => dayEpoch(a.date) - dayEpoch(b.date));
}

/** Days until the doors open. Negative once the show has started. */
export function daysToDoors(startDate: string, today: string = isoToday()): number {
  return daysBetween(startDate, today);
}

/**
 * The countdown as it reads in a badge. Deliberately phrased for a show that
 * hasn't happened yet — the caller decides whether to show it at all once the
 * show is running or finished.
 */
export function countdownLabel(days: number): string {
  if (days > 1) return `Opens in ${days} days`;
  if (days === 1) return "Opens tomorrow";
  if (days === 0) return "Opens today";
  if (days === -1) return "Opened yesterday";
  return `Opened ${Math.abs(days)} days ago`;
}
