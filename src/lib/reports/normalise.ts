/**
 * Report metrics + predictions normaliser.
 *
 * The data shape on `event_reports.metrics_json` / `predictions_json` has
 * drifted slightly between the action that writes it (`generateEventReport`
 * — camelCase), seed data (snake-ish), and the public viewer (mixed). This
 * module is the single place every renderer reads through, so a KPI never
 * silently lands on `0` because the renderer reached for the wrong key.
 *
 * Keep the input types deliberately loose — the JSONB columns are untyped
 * and we want the renderer to be tolerant of partial writes.
 */

export interface NormalisedMetrics {
  totalPlays: number;
  totalLeads: number;
  totalInteractions: number;
  totalPrizes: number;
  mediaImpressions: number;
  totalCostPence: number;
  avgDwellSeconds: number | null;
}

export interface NormalisedPredictions {
  estimatedInteractions: number | null;
  estimatedLeads: number | null;
  estimatedImpressions: number | null;
}

type Bag = Record<string, unknown>;

function num(...candidates: Array<unknown>): number {
  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  return 0;
}

function numOrNull(...candidates: Array<unknown>): number | null {
  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

/** Read metrics_json into a stable shape regardless of casing/keys. */
export function normaliseMetrics(input: unknown): NormalisedMetrics {
  const m: Bag = (input && typeof input === "object") ? (input as Bag) : {};
  return {
    totalPlays: num(m.totalPlays, m.total_plays, m.plays),
    totalLeads: num(m.totalLeads, m.total_leads, m.leads),
    totalInteractions: num(
      m.totalInteractions,
      m.total_interactions,
      m.interactions
    ),
    totalPrizes: num(m.totalPrizes, m.total_prizes, m.prizes),
    mediaImpressions: num(
      m.mediaImpressions,
      m.media_impressions,
      m.impressions
    ),
    totalCostPence: num(m.totalCost, m.total_cost, m.totalCostPence),
    avgDwellSeconds: numOrNull(m.avgDwellTime, m.avg_dwell_time, m.dwell),
  };
}

/** Read predictions_json into a stable shape. */
export function normalisePredictions(input: unknown): NormalisedPredictions {
  const p: Bag = (input && typeof input === "object") ? (input as Bag) : {};
  const raw: Bag =
    p.raw && typeof p.raw === "object" ? (p.raw as Bag) : {};
  return {
    estimatedInteractions: numOrNull(
      p.estimatedInteractions,
      p.estimated_interactions,
      raw.interactions
    ),
    estimatedLeads: numOrNull(
      p.estimatedLeads,
      p.estimated_leads,
      raw.leads
    ),
    estimatedImpressions: numOrNull(
      p.estimatedImpressions,
      p.estimated_impressions,
      raw.impressions
    ),
  };
}

/** Cost per lead in pence, or null when there are no leads. */
export function costPerLeadPence(metrics: NormalisedMetrics): number | null {
  if (metrics.totalLeads <= 0) return null;
  return Math.round(metrics.totalCostPence / metrics.totalLeads);
}

/**
 * Validate the highlights_json contract.
 *
 * We accept either:
 *  - the canonical `{ url, caption?, stat? }[]` shape, or
 *  - bare strings (treated as captions, no image).
 * Anything else is filtered.
 */
export interface Highlight {
  url?: string;
  caption?: string;
  stat?: string;
}

export function normaliseHighlights(input: unknown): Highlight[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((h): Highlight | null => {
      if (typeof h === "string") return { caption: h };
      if (h && typeof h === "object") {
        const obj = h as Bag;
        return {
          url: typeof obj.url === "string" ? obj.url : undefined,
          caption: typeof obj.caption === "string" ? obj.caption : undefined,
          stat: typeof obj.stat === "string" ? obj.stat : undefined,
        };
      }
      return null;
    })
    .filter((h): h is Highlight => h !== null);
}
