/**
 * What one unit is likely to do, from what comparable units have done.
 *
 * A sponsorship conversation stalls on "how many people will actually use
 * it?", and an ops team plans stock against the same number. We already store
 * the answer — the `benchmarks` table holds plays and leads per day with a
 * p25–p75 spread and a sample size — and have never shown it to an organizer
 * or a prospective sponsor.
 *
 * Two rules this module exists to enforce. It only ever returns a *range*
 * carrying its sample size, because a single confident number invites a
 * complaint when reality lands either side of it. And it returns null rather
 * than degrading to a guess when nothing comparable exists: no line at all
 * beats an invented one.
 */

/** A benchmark row, reduced to the fields an expectation is built from. */
export interface BenchmarkInput {
  metricName: string;
  eventType: string;
  machineType?: string | null;
  medianValue?: number | null;
  avgValue?: number | null;
  p25Value?: number | null;
  p75Value?: number | null;
  sampleSize?: number | null;
}

/** Which question the expectation answers. */
export type ExpectationMetric = "plays" | "leads";

export interface Expectation {
  metric: ExpectationMetric;
  perDayLow: number;
  perDayHigh: number;
  /** Per-day range multiplied out across the length of the show. */
  totalLow: number;
  totalHigh: number;
  /** Comparable activations behind the range, for the honesty line. */
  sampleSize: number;
  /**
   * `machine` when comparable rows for this hardware existed, `event` when the
   * range is drawn from the event type alone. Surfaced so the caller can say
   * which, rather than implying a closer match than we have.
   */
  basis: "machine" | "event";
}

/** The benchmark metric behind each expectation. */
const METRIC_NAMES: Record<ExpectationMetric, string> = {
  plays: "plays_per_day",
  leads: "leads_per_day",
};

/** Widest defensible daily floor for one row: p25, else the midpoint. */
function lowOf(row: BenchmarkInput): number | null {
  return firstNumber(row.p25Value, row.medianValue, row.avgValue);
}

/** Widest defensible daily ceiling for one row: p75, else the midpoint. */
function highOf(row: BenchmarkInput): number | null {
  return firstNumber(row.p75Value, row.medianValue, row.avgValue);
}

function firstNumber(...values: (number | null | undefined)[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

/**
 * Build the expectation for one metric.
 *
 * Rows are matched on event type first (a trade show and a shopping centre
 * behave nothing alike), then narrowed to the machine type when we hold rows
 * for it. Where several location tiers match, they are merged into one wider
 * range rather than us picking a tier the organizer never told us — a range
 * that spans tier 1 and tier 2 is honest; guessing which one this show is
 * would not be.
 */
export function buildExpectation(
  rows: BenchmarkInput[],
  options: {
    metric: ExpectationMetric;
    eventType?: string | null;
    machineType?: string | null;
    /** Days the unit is on the floor. Defaults to a single day. */
    days?: number;
  }
): Expectation | null {
  const { metric, eventType, machineType, days = 1 } = options;
  const metricName = METRIC_NAMES[metric];

  const sameMetric = rows.filter(
    (row) =>
      row.metricName === metricName &&
      (!eventType || row.eventType === eventType)
  );
  if (sameMetric.length === 0) return null;

  const machineMatches = machineType
    ? sameMetric.filter((row) => row.machineType === machineType)
    : [];
  const candidates = machineMatches.length > 0 ? machineMatches : sameMetric;
  const basis = machineMatches.length > 0 ? "machine" : "event";

  let low = Infinity;
  let high = -Infinity;
  let sampleSize = 0;
  for (const row of candidates) {
    const rowLow = lowOf(row);
    const rowHigh = highOf(row);
    if (rowLow === null || rowHigh === null) continue;
    low = Math.min(low, rowLow);
    high = Math.max(high, rowHigh);
    sampleSize += Number(row.sampleSize) || 0;
  }
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;

  const span = Math.max(1, Math.round(days));
  return {
    metric,
    perDayLow: Math.round(low),
    perDayHigh: Math.round(high),
    totalLow: Math.round(low) * span,
    totalHigh: Math.round(high) * span,
    sampleSize,
    basis,
  };
}

/** A range as it reads in a sentence: "250–300", or just "250" when flat. */
export function formatRange(low: number, high: number): string {
  const fmt = (n: number) => n.toLocaleString("en-GB");
  return low === high ? fmt(low) : `${fmt(low)}–${fmt(high)}`;
}

/**
 * The caveat that goes under any expectation. Naming the sample size and how
 * loosely it matched is what keeps this a forecast rather than a promise.
 */
export function expectationBasisLabel(expectation: Expectation): string {
  const shows = `${expectation.sampleSize} comparable ${
    expectation.sampleSize === 1 ? "activation" : "activations"
  }`;
  return expectation.basis === "machine"
    ? `Based on ${shows} with this machine`
    : `Based on ${shows} of this type`;
}

/** Whole days a unit is on the floor, counting both the first and the last. */
export function showDayCount(startDate: string, endDate?: string | null): number {
  const start = Date.parse(`${startDate.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${(endDate ?? startDate).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 1;
  return Math.round((end - start) / 86_400_000) + 1;
}
