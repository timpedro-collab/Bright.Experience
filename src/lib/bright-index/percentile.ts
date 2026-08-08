/**
 * Bright Index placement — where one event sits against the pooled
 * benchmarks, expressed as an honest quartile band (the `benchmarks` table
 * stores p25/median/p75, so quartiles are the finest claim the data
 * supports — we never print "top decile" from quartile inputs).
 *
 * Pure module: feeds the report badge, the Wrapped story, and the
 * /bright-index methodology note, so every surface makes the same claim.
 */

import {
  MIN_PUBLISHABLE_SAMPLE,
  type PublicBenchmarkRow,
} from "@/lib/bright-index/shape";

export type PercentileBand =
  | "top_quartile"
  | "above_median"
  | "below_median"
  | "bottom_quartile";

export interface IndexPlacement {
  band: PercentileBand;
  /** Customer-facing claim, e.g. "Top 25% of brand activations". */
  label: string;
  /** Badge title when earned, e.g. "Top-Quartile Activation · Q3 2026". Null below the bar. */
  badge: string | null;
  /** The quarter the placement was computed in, e.g. "Q3 2026". */
  quarter: string;
  /** Events underpinning the comparison — printed for credibility. */
  sampleSize: number;
  /** The metric the placement is based on, e.g. "opted-in leads per day". */
  metricLabel: string;
}

/** "Q3 2026" for a given date. */
export function quarterLabel(when: Date = new Date()): string {
  const q = Math.floor(when.getUTCMonth() / 3) + 1;
  return `Q${q} ${when.getUTCFullYear()}`;
}

/**
 * The benchmark row an event should be compared against: same event type and
 * metric, preferring the all-venues aggregate (null tier + null machine),
 * then the largest publishable sample. Null when nothing comparable exists.
 */
export function pickComparisonRow(
  rows: PublicBenchmarkRow[],
  opts: { eventType: string; metricName: string }
): PublicBenchmarkRow | null {
  const candidates = rows.filter(
    (r) =>
      r.eventType === opts.eventType &&
      r.metricName === opts.metricName &&
      r.medianValue !== null &&
      r.sampleSize >= MIN_PUBLISHABLE_SAMPLE
  );
  if (candidates.length === 0) return null;
  const aggregate = candidates.find(
    (r) => r.locationTier === null && r.machineType === null
  );
  if (aggregate) return aggregate;
  return candidates.reduce((best, r) =>
    r.sampleSize > best.sampleSize ? r : best
  );
}

const BAND_LABELS: Record<PercentileBand, (subject: string) => string> = {
  top_quartile: (s) => `Top 25% of ${s} on the Bright Index`,
  above_median: (s) => `Above the median for ${s} on the Bright Index`,
  below_median: (s) => `Within the typical range for ${s}`,
  bottom_quartile: (s) => `Below the typical range for ${s}`,
};

/**
 * Place a value against a benchmark row's quartiles. Returns null when the
 * comparison would not be credible (no median, thin sample, or a
 * non-positive value — a zero has no place on a leaderboard).
 */
export function computeIndexPlacement(
  value: number,
  row: PublicBenchmarkRow | null,
  opts: {
    /** Plural, lower-case subject, e.g. "brand activations". */
    subjectLabel: string;
    metricLabel: string;
    when?: Date;
  }
): IndexPlacement | null {
  if (
    !row ||
    row.medianValue === null ||
    row.sampleSize < MIN_PUBLISHABLE_SAMPLE ||
    !(value > 0)
  ) {
    return null;
  }

  let band: PercentileBand;
  if (row.p75Value !== null && value >= row.p75Value) band = "top_quartile";
  else if (value >= row.medianValue) band = "above_median";
  else if (row.p25Value === null || value >= row.p25Value)
    band = "below_median";
  else band = "bottom_quartile";

  const quarter = quarterLabel(opts.when);
  return {
    band,
    label: BAND_LABELS[band](opts.subjectLabel),
    badge:
      band === "top_quartile"
        ? `Top-Quartile Activation · ${quarter}`
        : null,
    quarter,
    sampleSize: row.sampleSize,
    metricLabel: opts.metricLabel,
  };
}
