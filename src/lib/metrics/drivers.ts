/**
 * Canonical demo-data drivers — the ONE source for every play / lead / prize /
 * interaction / impression / dwell number in the portal.
 *
 * Anchored to trade-show & conference reality (locked with the team):
 *  - ~250-300 plays per machine per day (model ~275).
 *  - Completing the game = a play AND a prize, so prizes ≈ plays.
 *  - ~95% of players opt in as a lead.
 *  - Interactions run a little above plays (people who touch but don't finish).
 *  - On-site impressions are footfall-based (~50× plays).
 *  - Dwell sits in the 20-35s band (~28s).
 *  - Actuals beat the pre-event forecast by a varied 5-20%.
 *
 * Every number derives from these constants so the whole demo stays internally
 * consistent (snapshots → reports → benchmarks → campaign aggregates).
 */

const DRIVERS = {
  /** Plays per machine per day (mid-point of the 250-300 band). */
  playsPerMachineDay: 275,
  /** Share of plays that opt in as a lead. */
  leadConversion: 0.95,
  /** Prizes dispensed per play (a completed game ≈ a prize). */
  prizeRate: 0.98,
  /** Interactions per play (touches, incl. non-completers). */
  interactionMultiplier: 1.3,
  /** On-site impressions per play (footfall exposure). */
  impressionMultiplier: 50,
  /** Average dwell time, seconds. */
  dwellSeconds: 28,
} as const;

/** Add `n` days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Engagement totals derived from a play count. */
export function metricsFromPlays(plays: number) {
  return {
    plays,
    interactions: Math.round(plays * DRIVERS.interactionMultiplier),
    leads: Math.round(plays * DRIVERS.leadConversion),
    prizes: Math.round(plays * DRIVERS.prizeRate),
    impressions: Math.round(plays * DRIVERS.impressionMultiplier),
  };
}

/**
 * Synthesize a believable hour-of-day curve from an event total.
 *
 * Used by the live dashboard + print report when there is no same-day raw
 * telemetry to aggregate (e.g. a completed event whose by-hour rows were never
 * streamed). Distributes `totalPlays` across the trading window as a gaussian
 * peaking at `peakHour`, with leads derived at the standard opt-in rate — so
 * the chart's totals stay consistent with the headline metrics.
 */
export function hourlyCurveFromTotal(
  totalPlays: number,
  peakHour = 14,
  openHour = 8,
  closeHour = 20,
): { hour: number; plays: number; leads: number }[] {
  if (!totalPlays || totalPlays <= 0) {
    const empty: { hour: number; plays: number; leads: number }[] = [];
    for (let h = openHour; h <= closeHour; h++) empty.push({ hour: h, plays: 0, leads: 0 });
    return empty;
  }
  const sigma = 2.8; // hours — a natural mid-afternoon hump
  const weights: number[] = [];
  let weightSum = 0;
  for (let h = openHour; h <= closeHour; h++) {
    const d = h - peakHour;
    const w = Math.exp(-(d * d) / (2 * sigma * sigma));
    weights.push(w);
    weightSum += w;
  }
  return weights.map((w, i) => {
    const plays = Math.round((totalPlays * w) / weightSum);
    return {
      hour: openHour + i,
      plays,
      leads: Math.round(plays * DRIVERS.leadConversion),
    };
  });
}

export interface SnapshotRow {
  event_id: string;
  snapshot_date: string;
  total_plays: number;
  total_interactions: number;
  total_leads: number;
  total_prizes: number;
  avg_dwell_time: number;
  peak_hour: number;
  is_final: boolean;
  /** Units left in the machine(s); null when capacity is unknown. */
  stock_remaining?: number | null;
  /** Total units loaded for the event. */
  stock_capacity?: number | null;
}

export interface BuildSnapshotsOptions {
  eventId: string;
  /** First show day, YYYY-MM-DD. */
  startDate: string;
  /** Number of show days. */
  days: number;
  /** Machines on site (multiplies daily throughput). Default 1. */
  machines?: number;
  /** Override plays per machine per day. Default {@link DRIVERS.playsPerMachineDay}. */
  playsPerMachineDay?: number;
  /** Peak hour for each day; cycles if shorter than `days`. */
  peakHours?: number[];
  /** Dwell seconds per day; cycles if shorter than `days`. Default ~DRIVERS.dwellSeconds. */
  dwellByDay?: number[];
  /**
   * Total prize/sample units loaded for the event. When set, each snapshot
   * carries `stock_capacity` and a `stock_remaining` of capacity minus the
   * cumulative prizes dispensed (floored at zero) for the live stock tile.
   */
  stockCapacity?: number;
}

/**
 * Build CUMULATIVE daily snapshots (each day ≥ the prior). The final row is the
 * event total. A small deterministic per-day curve keeps it from looking
 * perfectly linear while still landing on a clean total.
 */
export function buildSnapshots(opts: BuildSnapshotsOptions): SnapshotRow[] {
  const machines = opts.machines ?? 1;
  const perDay = (opts.playsPerMachineDay ?? DRIVERS.playsPerMachineDay) * machines;
  const peakHours = opts.peakHours ?? [14, 15, 13, 16, 12];
  // Gentle curve: day 1 slightly soft, mid-days strong, last day softer.
  const curve = [0.96, 1.06, 1.02, 1.0, 0.98, 1.04, 1.0];

  const rows: SnapshotRow[] = [];
  let cumulative = 0;
  for (let i = 0; i < opts.days; i++) {
    const dayPlays = Math.round(perDay * (curve[i % curve.length] ?? 1));
    cumulative += dayPlays;
    const m = metricsFromPlays(cumulative);
    const dwell =
      opts.dwellByDay?.[i] ??
      DRIVERS.dwellSeconds + ((i % 3) - 1); // ~27-29s
    const row: SnapshotRow = {
      event_id: opts.eventId,
      snapshot_date: addDays(opts.startDate, i),
      total_plays: cumulative,
      total_interactions: m.interactions,
      total_leads: m.leads,
      total_prizes: m.prizes,
      avg_dwell_time: dwell,
      peak_hour: peakHours[i % peakHours.length] ?? 14,
      is_final: i === opts.days - 1,
    };
    if (opts.stockCapacity != null) {
      row.stock_capacity = opts.stockCapacity;
      row.stock_remaining = Math.max(0, opts.stockCapacity - m.prizes);
    }
    rows.push(row);
  }
  return rows;
}

/** Extra engagement fields surfaced in the redesigned reports. */
export interface ReportEngagementExtras {
  totalSamples: number;
  npsScore: number;
  survey: { question: string; score: number; responses: number }[];
  socialShares: number;
  qrScans: number;
  demographics: Record<string, number>;
  peakHours: number[];
  /** Machine guardrail counts: junk entries turned away at capture. */
  captureQuality: { rejectedDomains: number; duplicatesBlocked: number };
}

export interface BuildReportOptions {
  /** Total plays for the event (typically the final snapshot's total_plays). */
  totalPlays: number;
  /** Production/run cost in integer cents (shown internally only). */
  totalCostCents?: number;
  /** Average dwell, seconds. Default {@link DRIVERS.dwellSeconds}. */
  dwellSeconds?: number;
  /** How much actuals beat the forecast, as a fraction (e.g. 0.13 = +13%). */
  forecastBeatPct?: number;
  /** Richer engagement data for the redesigned report. */
  extras?: Partial<ReportEngagementExtras>;
  snapshotCount?: number;
}

export interface ReportMetrics {
  totalPlays: number;
  totalInteractions: number;
  totalLeads: number;
  totalPrizes: number;
  mediaImpressions: number;
  avgDwellTime: number;
  totalCost?: number;
  npsScore?: number;
  totalSamples?: number;
  survey?: ReportEngagementExtras["survey"];
  socialShares?: number;
  qrScans?: number;
  demographics?: Record<string, number>;
  peakHours?: number[];
  captureQuality?: ReportEngagementExtras["captureQuality"];
  snapshotCount?: number;
}

/** Build a report `metrics_json` blob from the drivers. */
export function buildReportMetrics(opts: BuildReportOptions): ReportMetrics {
  const m = metricsFromPlays(opts.totalPlays);
  const base: ReportMetrics = {
    totalPlays: m.plays,
    totalInteractions: m.interactions,
    totalLeads: m.leads,
    totalPrizes: m.prizes,
    mediaImpressions: m.impressions,
    avgDwellTime: opts.dwellSeconds ?? DRIVERS.dwellSeconds,
  };
  if (opts.totalCostCents != null) base.totalCost = opts.totalCostCents;
  if (opts.snapshotCount != null) base.snapshotCount = opts.snapshotCount;
  const e = opts.extras ?? {};
  if (e.totalSamples != null) base.totalSamples = e.totalSamples;
  if (e.npsScore != null) base.npsScore = e.npsScore;
  if (e.survey != null) base.survey = e.survey;
  if (e.socialShares != null) base.socialShares = e.socialShares;
  if (e.qrScans != null) base.qrScans = e.qrScans;
  if (e.demographics != null) base.demographics = e.demographics;
  if (e.peakHours != null) base.peakHours = e.peakHours;
  if (e.captureQuality != null) base.captureQuality = e.captureQuality;
  return base;
}

export interface ForecastBlocks {
  predictions_json: {
    estimatedInteractions: number;
    estimatedLeads: number;
    estimatedImpressions: number;
  };
  comparison_json: {
    interactions: { predicted: number; actual: number; delta: number };
    leads: { predicted: number; actual: number; delta: number };
    impressions: { predicted: number; actual: number; delta: number };
  };
}

/**
 * Derive the pre-event forecast so actuals beat it by `beatPct` (5-20%).
 * Forecast = actual / (1 + beatPct), rounded.
 */
export function buildForecast(metrics: ReportMetrics, beatPct: number): ForecastBlocks {
  const f = (actual: number) => Math.round(actual / (1 + beatPct));
  const estInteractions = f(metrics.totalInteractions);
  const estLeads = f(metrics.totalLeads);
  const estImpressions = f(metrics.mediaImpressions);
  return {
    predictions_json: {
      estimatedInteractions: estInteractions,
      estimatedLeads: estLeads,
      estimatedImpressions: estImpressions,
    },
    comparison_json: {
      interactions: {
        predicted: estInteractions,
        actual: metrics.totalInteractions,
        delta: metrics.totalInteractions - estInteractions,
      },
      leads: {
        predicted: estLeads,
        actual: metrics.totalLeads,
        delta: metrics.totalLeads - estLeads,
      },
      impressions: {
        predicted: estImpressions,
        actual: metrics.mediaImpressions,
        delta: metrics.mediaImpressions - estImpressions,
      },
    },
  };
}
