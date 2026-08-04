/**
 * Dark-day detection for venue placements.
 *
 * A dark day is a future day inside a placement's window with no
 * sponsorship slot over it at all — not even an unsold one on the market.
 * Dark days are pure lost yield: the machine stands there, the footfall
 * walks past, and nothing is for sale. The calendar exists to turn those
 * gaps into "open this week for sponsorship" one-clicks.
 */

/** One contiguous run of uncovered days. Dates are inclusive YYYY-MM-DD. */
export interface DarkDayGap {
  start: string;
  end: string;
  days: number;
}

interface SlotWindow {
  start_date: string;
  end_date: string | null;
}

/** How far past today an open-ended placement is scanned. */
export const DARK_DAY_HORIZON_DAYS = 90;

const DAY_MS = 86_400_000;

function toUtcDay(iso: string): number {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Math.floor(d.getTime() / DAY_MS);
}

function toIso(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Contiguous uncovered future gaps within a placement window.
 *
 * The scan starts at today (past dark days are history, not inventory) and
 * ends at the placement end, or `DARK_DAY_HORIZON_DAYS` out when the
 * placement is open-ended. Every slot counts as cover regardless of status:
 * an available slot is already on the market, so it isn't dark.
 */
export function darkDayGaps(
  placementStart: string,
  placementEnd: string | null,
  slots: SlotWindow[],
  today: Date = new Date(),
): DarkDayGap[] {
  const todayDay = Math.floor(today.getTime() / DAY_MS);
  const scanStart = Math.max(toUtcDay(placementStart), todayDay);
  const scanEnd = placementEnd
    ? toUtcDay(placementEnd)
    : todayDay + DARK_DAY_HORIZON_DAYS;
  if (scanEnd < scanStart) return [];

  const covered = new Set<number>();
  for (const slot of slots) {
    const from = toUtcDay(slot.start_date);
    const to = slot.end_date ? toUtcDay(slot.end_date) : from;
    for (let d = Math.max(from, scanStart); d <= Math.min(to, scanEnd); d++) {
      covered.add(d);
    }
  }

  const gaps: DarkDayGap[] = [];
  let gapStart: number | null = null;
  for (let d = scanStart; d <= scanEnd + 1; d++) {
    const dark = d <= scanEnd && !covered.has(d);
    if (dark && gapStart === null) gapStart = d;
    if (!dark && gapStart !== null) {
      gaps.push({
        start: toIso(gapStart),
        end: toIso(d - 1),
        days: d - gapStart,
      });
      gapStart = null;
    }
  }
  return gaps;
}

/** Total uncovered days across a set of gaps. */
export function totalDarkDays(gaps: DarkDayGap[]): number {
  return gaps.reduce((sum, g) => sum + g.days, 0);
}

/**
 * What a gap is roughly worth at a per-day rate, in pence. Null when the
 * placement has no day rate to price it against.
 */
export function gapValuePence(
  gap: DarkDayGap,
  dayRatePence: number | null,
): number | null {
  if (dayRatePence === null || dayRatePence <= 0) return null;
  return gap.days * dayRatePence;
}
