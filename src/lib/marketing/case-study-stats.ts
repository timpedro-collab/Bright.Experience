/**
 * Headline numbers from a case study's `stats_json`, ready to render.
 *
 * `stats_json` is a free-form object written by whoever published the study,
 * so no surface should reach into it by key. This is the one place that knows
 * which keys exist, what each one is called in front of a client, and the
 * order they carry the most weight in — plays first (it happened), then reach,
 * then the data outcome a sponsor is actually buying.
 *
 * Unknown keys are dropped rather than guessed at: a stat with a label derived
 * from a database key ("consentRatePct: 100") reads like a leak, not proof.
 */

/** One number as it appears on a proof strip. */
export interface CaseStudyStat {
  value: string;
  label: string;
}

/** Rounds a count into the shorthand a slide would use: 200,000 → "200k". */
function compact(value: number): string {
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  return value.toLocaleString("en-GB");
}

/**
 * Known keys, in the order they are shown. Each entry says how to render the
 * number and what to call it, so adding a stat is a one-line change here
 * rather than a conditional in a component.
 */
const KNOWN_STATS: {
  key: string;
  label: string;
  format: (value: number) => string;
}[] = [
  { key: "gamePlays", label: "game plays", format: compact },
  { key: "brandImpressions", label: "brand impressions", format: compact },
  { key: "marketingOptIns", label: "opted-in leads", format: compact },
  { key: "consentRatePct", label: "consent rate", format: (v) => `${v}%` },
  { key: "leadsCaptured", label: "leads captured", format: compact },
  { key: "productsDispensed", label: "products dispensed", format: compact },
];

/**
 * Pull the renderable stats out of a case study's `stats_json`.
 *
 * @param stats The raw jsonb column, in whatever shape it arrived.
 * @param limit Most stats to return, since a proof strip has finite room.
 */
export function caseStudyStats(stats: unknown, limit = 3): CaseStudyStat[] {
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) return [];
  const source = stats as Record<string, unknown>;

  const out: CaseStudyStat[] = [];
  for (const known of KNOWN_STATS) {
    if (out.length >= limit) break;
    const raw = source[known.key];
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value) || value <= 0) continue;
    out.push({ value: known.format(value), label: known.label });
  }
  return out;
}

/** A case study reduced to what a proof strip needs. */
export interface CaseStudyProof {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  heroImageUrl: string | null;
  stats: CaseStudyStat[];
}

/**
 * The studies worth putting in front of a sponsor: published, with at least
 * one hard number behind them. A case study with no stats is a story, and a
 * story next to two sets of numbers reads as the weak one.
 */
export function toCaseStudyProof(
  rows: Record<string, unknown>[],
  limit = 3
): CaseStudyProof[] {
  return rows
    .map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      slug: String(row.slug ?? ""),
      clientName: row.client_name ? String(row.client_name) : null,
      heroImageUrl: row.hero_image_url ? String(row.hero_image_url) : null,
      stats: caseStudyStats(row.stats_json),
    }))
    .filter((study) => study.stats.length > 0)
    .slice(0, limit);
}
