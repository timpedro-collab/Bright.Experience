/**
 * The Bright Index — pure shaping of anonymised fleet benchmarks for the
 * public authority pages (/bright-index, /state-of-play).
 *
 * Everything here is aggregate-only by construction: the input rows are the
 * `benchmarks` table (medians and quartiles across completed events), never
 * event- or client-level data. The publication floor keeps thin segments out
 * of print so no single activation is inferable.
 */

/** Rows below this sample size are not published — too identifying, too noisy. */
export const MIN_PUBLISHABLE_SAMPLE = 5;

/** A benchmarks row as read by the public-benchmarks query (camelCase). */
export interface PublicBenchmarkRow {
  eventType: string;
  locationTier: string | null;
  machineType: string | null;
  metricName: string;
  medianValue: number | null;
  p25Value: number | null;
  p75Value: number | null;
  sampleSize: number;
  updatedAt: string;
}

/** Metrics the Index publishes, with public-facing labels. Order = display order. */
export const INDEX_METRICS: ReadonlyArray<{
  name: string;
  label: string;
  unit: string;
}> = [
  { name: "plays_per_day", label: "Plays per day", unit: "plays" },
  { name: "leads_per_day", label: "Opted-in leads per day", unit: "leads" },
  { name: "samples_per_day", label: "Samples dispensed per day", unit: "samples" },
  { name: "avg_dwell_time", label: "Average dwell time", unit: "seconds" },
];

const METRIC_LABELS = new Map(INDEX_METRICS.map((m) => [m.name, m]));

/** Public-facing venue-class label. `null` tier = the all-venues aggregate row. */
export function tierLabel(tier: string | null): string {
  switch (tier) {
    case "tier_1":
      return "Premium venues";
    case "tier_2":
      return "Major venues";
    case "tier_3":
      return "Regional venues";
    case "tier_4":
      return "Local venues";
    case null:
      return "All venue classes";
    default:
      return tier;
  }
}

/** Public-facing event-type label. */
export function eventTypeLabel(eventType: string): string {
  switch (eventType) {
    case "activation":
      return "Brand activations";
    case "sampling":
      return "Product sampling";
    case "conference":
      return "Conferences & trade shows";
    case "exhibition":
      return "Exhibitions";
    case "festival":
      return "Festivals";
    default:
      return eventType.charAt(0).toUpperCase() + eventType.slice(1);
  }
}

export interface IndexEntry {
  tier: string | null;
  tierLabel: string;
  machineType: string | null;
  median: number;
  p25: number | null;
  p75: number | null;
  sampleSize: number;
}

export interface IndexMetricGroup {
  metricName: string;
  metricLabel: string;
  unit: string;
  entries: IndexEntry[];
}

export interface IndexSection {
  eventType: string;
  eventTypeLabel: string;
  metrics: IndexMetricGroup[];
}

const TIER_ORDER: Record<string, number> = {
  tier_1: 0,
  tier_2: 1,
  tier_3: 2,
  tier_4: 3,
};

function tierRank(tier: string | null): number {
  if (tier === null) return 99; // the all-venues row prints last
  return TIER_ORDER[tier] ?? 50;
}

/** True when a row clears the publication bar: known metric, real median, enough sample. */
export function isPublishable(row: PublicBenchmarkRow): boolean {
  return (
    METRIC_LABELS.has(row.metricName) &&
    row.medianValue !== null &&
    row.sampleSize >= MIN_PUBLISHABLE_SAMPLE
  );
}

/**
 * Group publishable rows into event-type sections with metrics in canonical
 * order and entries sorted premium-first. Sections with no publishable rows
 * are dropped entirely.
 */
export function shapeIndex(rows: PublicBenchmarkRow[]): IndexSection[] {
  const byEventType = new Map<string, PublicBenchmarkRow[]>();
  for (const row of rows) {
    if (!isPublishable(row)) continue;
    const bucket = byEventType.get(row.eventType) ?? [];
    bucket.push(row);
    byEventType.set(row.eventType, bucket);
  }

  const sections: IndexSection[] = [];
  for (const [eventType, bucket] of byEventType) {
    const metrics: IndexMetricGroup[] = [];
    for (const meta of INDEX_METRICS) {
      const entries = bucket
        .filter((r) => r.metricName === meta.name)
        .sort((a, b) => tierRank(a.locationTier) - tierRank(b.locationTier))
        .map((r) => ({
          tier: r.locationTier,
          tierLabel: tierLabel(r.locationTier),
          machineType: r.machineType,
          median: r.medianValue as number,
          p25: r.p25Value,
          p75: r.p75Value,
          sampleSize: r.sampleSize,
        }));
      if (entries.length > 0) {
        metrics.push({
          metricName: meta.name,
          metricLabel: meta.label,
          unit: meta.unit,
          entries,
        });
      }
    }
    if (metrics.length > 0) {
      sections.push({
        eventType,
        eventTypeLabel: eventTypeLabel(eventType),
        metrics,
      });
    }
  }

  // Stable order: activations lead (the flagship story), then alphabetical.
  sections.sort((a, b) => {
    if (a.eventType === "activation") return -1;
    if (b.eventType === "activation") return 1;
    return a.eventType.localeCompare(b.eventType);
  });
  return sections;
}

/** Latest refresh date across the published rows, or null when nothing prints. */
export function indexFreshness(rows: PublicBenchmarkRow[]): string | null {
  let latest: string | null = null;
  for (const row of rows) {
    if (!isPublishable(row)) continue;
    if (latest === null || row.updatedAt > latest) latest = row.updatedAt;
  }
  return latest;
}

/** Total events underpinning the published rows (max sample per section, summed). */
export function indexSampleTotal(sections: IndexSection[]): number {
  let total = 0;
  for (const section of sections) {
    let sectionMax = 0;
    for (const metric of section.metrics) {
      for (const entry of metric.entries) {
        sectionMax = Math.max(sectionMax, entry.sampleSize);
      }
    }
    total += sectionMax;
  }
  return total;
}
