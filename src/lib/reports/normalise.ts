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

export interface SurveyResult {
  question: string;
  score: number;
  responses: number;
}

/** Machine-enforced capture guardrail counts (P2.1 reporting proof). */
export interface CaptureQualityCounts {
  rejectedDomains: number;
  duplicatesBlocked: number;
}

/**
 * One sponsor's slice of a show, as written by `generateEventReport`.
 * Counters only — this block is shared with the sponsor.
 */
export interface SponsorProofRow {
  slotId: string;
  sponsorName: string;
  zone: string | null;
  machineLabel: string | null;
  plays: number;
  leads: number;
  prizes: number;
  optInRate: number;
}

export interface NormalisedMetrics {
  totalPlays: number;
  totalLeads: number;
  totalInteractions: number;
  totalPrizes: number;
  mediaImpressions: number;
  totalCostPence: number;
  avgDwellSeconds: number | null;
  /** Engagement extras (post-show report). */
  totalSamples: number | null;
  npsScore: number | null;
  socialShares: number | null;
  qrScans: number | null;
  survey: SurveyResult[];
  demographics: Record<string, number>;
  peakHours: number[];
  /** Null when the event predates capture-quality tracking. */
  captureQuality: CaptureQualityCounts | null;
  /** Empty unless the show sold sponsor slots against its machines. */
  sponsors: SponsorProofRow[];
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

function normaliseSurvey(input: unknown): SurveyResult[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((s): SurveyResult | null => {
      if (!s || typeof s !== "object") return null;
      const o = s as Bag;
      const question = typeof o.question === "string" ? o.question : null;
      if (!question) return null;
      return {
        question,
        score: num(o.score),
        responses: num(o.responses),
      };
    })
    .filter((s): s is SurveyResult => s !== null);
}

function normaliseDemographics(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input as Bag)) {
    const n = num(v);
    if (n > 0) out[k] = n;
  }
  return out;
}

function normalisePeakHours(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  return input.map((v) => num(v)).filter((n) => n >= 0 && n <= 23);
}

function normaliseCaptureQuality(input: unknown): CaptureQualityCounts | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Bag;
  return {
    rejectedDomains: num(o.rejectedDomains, o.rejected_domains),
    duplicatesBlocked: num(o.duplicatesBlocked, o.duplicates_blocked),
  };
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function normaliseSponsors(input: unknown): SponsorProofRow[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((s): SponsorProofRow | null => {
      if (!s || typeof s !== "object") return null;
      const o = s as Bag;
      const sponsorName = str(o.sponsorName ?? o.sponsor_name);
      if (!sponsorName) return null;
      return {
        slotId: String(o.slotId ?? o.slot_id ?? ""),
        sponsorName,
        zone: str(o.zone),
        machineLabel: str(o.machineLabel ?? o.machine_label),
        plays: num(o.plays),
        leads: num(o.leads),
        prizes: num(o.prizes),
        optInRate: num(o.optInRate, o.opt_in_rate),
      };
    })
    .filter((s): s is SponsorProofRow => s !== null);
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
    totalSamples: numOrNull(m.totalSamples, m.total_samples, m.samples),
    npsScore: numOrNull(m.npsScore, m.nps_score, m.nps),
    socialShares: numOrNull(m.socialShares, m.social_shares),
    qrScans: numOrNull(m.qrScans, m.qr_scans),
    survey: normaliseSurvey(m.survey),
    demographics: normaliseDemographics(m.demographics),
    peakHours: normalisePeakHours(m.peakHours ?? m.peak_hours),
    captureQuality: normaliseCaptureQuality(m.captureQuality ?? m.capture_quality),
    sponsors: normaliseSponsors(m.sponsors),
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

/** Which headline-tier KPIs have real underlying data (never £0.00 / 0 / —). */
export interface HeadlineMetricPresence {
  costPerLead: boolean;
  footfallImpressions: boolean;
  satisfaction: boolean;
}

/** True when both spend and captured leads exist — CPL is meaningful. */
export function isRenderableCostPerLead(metrics: NormalisedMetrics): boolean {
  return metrics.totalCostPence > 0 && metrics.totalLeads > 0;
}

/** True when footfall impressions were actually measured (> 0). */
export function isRenderableFootfallImpressions(
  metrics: NormalisedMetrics
): boolean {
  return metrics.mediaImpressions > 0;
}

/** True when a satisfaction score was recorded (not absent/null). */
export function isRenderableSatisfaction(metrics: NormalisedMetrics): boolean {
  return metrics.npsScore != null;
}

/** Single read for pages deciding which headline tiles to render. */
export function headlineMetricPresence(
  metrics: NormalisedMetrics
): HeadlineMetricPresence {
  return {
    costPerLead: isRenderableCostPerLead(metrics),
    footfallImpressions: isRenderableFootfallImpressions(metrics),
    satisfaction: isRenderableSatisfaction(metrics),
  };
}

/** Cost per lead in pence, or null when spend or leads are missing. */
export function costPerLeadPence(metrics: NormalisedMetrics): number | null {
  if (!isRenderableCostPerLead(metrics)) return null;
  return Math.round(metrics.totalCostPence / metrics.totalLeads);
}

/** Formatted satisfaction headline value, or null when not measured. */
export function formatSatisfactionScore(
  metrics: NormalisedMetrics
): string | null {
  if (!isRenderableSatisfaction(metrics) || metrics.npsScore == null) {
    return null;
  }
  return `${metrics.npsScore.toFixed(1)} / 5`;
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
