/**
 * Fleet availability by month — the honest "3 of 5 units booked for March"
 * arithmetic behind the pricing page's availability module.
 *
 * Pure module: takes raw fleet/event/placement rows and a month, returns how
 * many units are genuinely committed. Scarcity here is real — it is derived
 * from the booking calendar, never invented.
 */

export interface FleetInstanceRow {
  id: string;
  current_event_id: string | null;
}

export interface FleetEventRow {
  id: string;
  event_date_start: string | null;
  event_date_end: string | null;
  stage?: string | null;
}

export interface FleetPlacementRow {
  machine_instance_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status?: string | null;
}

export interface FleetRows {
  instances: FleetInstanceRow[];
  events: FleetEventRow[];
  placements: FleetPlacementRow[];
}

export interface MonthAvailability {
  /** "2026-09" */
  month: string;
  /** "September 2026" */
  label: string;
  total: number;
  booked: number;
}

/** Stages that no longer hold a unit. */
const DEAD_EVENT_STAGES = new Set(["cancelled", "lost", "declined"]);

/** ISO date (yyyy-mm-dd) prefix of a possibly-timestamped value. */
function day(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function monthBounds(month: string): { first: string; last: string } {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    first: `${month}-01`,
    last: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function overlapsMonth(
  start: string | null,
  end: string | null,
  month: string,
): boolean {
  const s = day(start);
  if (!s) return false;
  const e = day(end) ?? s;
  const { first, last } = monthBounds(month);
  return s <= last && e >= first;
}

/** "September 2026" for a "2026-09" month key. */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The next `n` month keys ("YYYY-MM") starting from the month after `from`. */
export function upcomingMonths(n: number, from: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
    months.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return months;
}

/**
 * How many fleet units are committed in `month`.
 *
 * A unit counts as booked when it is assigned to a live-stage event whose
 * dates overlap the month, or held by a venue placement overlapping the
 * month. Events overlapping the month with no unit assigned yet still
 * reserve one unit each — the commitment exists even before allocation.
 */
export function computeMonthAvailability(
  rows: FleetRows,
  month: string,
): MonthAvailability {
  const total = rows.instances.length;

  const eventsInMonth = rows.events.filter(
    (e) =>
      !DEAD_EVENT_STAGES.has((e.stage ?? "").toLowerCase()) &&
      overlapsMonth(e.event_date_start, e.event_date_end, month),
  );
  const eventIdsInMonth = new Set(eventsInMonth.map((e) => e.id));

  const bookedIds = new Set<string>();
  const eventsWithUnits = new Set<string>();
  for (const inst of rows.instances) {
    if (inst.current_event_id && eventIdsInMonth.has(inst.current_event_id)) {
      bookedIds.add(inst.id);
      eventsWithUnits.add(inst.current_event_id);
    }
  }
  for (const p of rows.placements) {
    if ((p.status ?? "").toLowerCase() === "cancelled") continue;
    if (p.machine_instance_id && overlapsMonth(p.start_date, p.end_date, month)) {
      bookedIds.add(p.machine_instance_id);
    }
  }

  // Booked events with no allocated unit yet still hold one unit each.
  const unallocated = eventsInMonth.filter((e) => !eventsWithUnits.has(e.id)).length;

  return {
    month,
    label: monthLabel(month),
    total,
    booked: Math.min(total, bookedIds.size + unallocated),
  };
}
