/**
 * Loop-pulse maths — pure helpers behind the /admin/loop-pulse dashboard.
 *
 * The dashboard makes the growth loop's claims provable (accepted→provisioned
 * time, report view rate, rebook rate, invitation clicks, capture rate), so
 * every number here must be honest: rates return null rather than 0% or 100%
 * when the denominator is missing, and durations use medians so one stuck
 * quote can't flatter or tank the picture.
 */

/** Median of a list of millisecond durations, in hours. Null when empty. */
export function medianDurationHours(durationsMs: number[]): number | null {
  const valid = durationsMs.filter((d) => Number.isFinite(d) && d >= 0);
  if (valid.length === 0) return null;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return median / 3_600_000;
}

/** "0.4 h" → "24 min"; "3.2 h"; "2.1 days" — one honest unit, no false precision. */
export function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} days`;
}

/**
 * A share as a 0–100 integer percentage, or null when the denominator is
 * zero — an empty denominator is "no data yet", never "0%".
 */
export function ratePct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

/** "62%" or "—" for null (no data yet). */
export function formatPct(pct: number | null): string {
  return pct === null ? "—" : `${pct}%`;
}

/** Human label for each invitation-footer artifact key. */
export const ARTIFACT_LABELS: Record<string, string> = {
  report: "Public report",
  live: "Live dashboard",
  sponsor_pitch: "Sponsor pitch",
  venue_widget: "Venue widget",
  player_card: "Player result card",
};

export function artifactLabel(artifact: string): string {
  return ARTIFACT_LABELS[artifact] ?? artifact;
}

export interface InvitationRow {
  artifact: string;
  label: string;
  landings: number;
  /** Views of the artifact where we track them, else null (no denominator). */
  views: number | null;
  /** Click-through percentage when views are known. */
  ctrPct: number | null;
}

/**
 * Join invitation landings with the view counts we actually track (public
 * report opens, player-card views). Artifacts without a tracked denominator
 * report landings only — no invented CTR.
 */
export function buildInvitationRows(
  landingsByArtifact: Record<string, number>,
  viewsByArtifact: Record<string, number>,
): InvitationRow[] {
  const artifacts = new Set([
    ...Object.keys(landingsByArtifact),
    ...Object.keys(viewsByArtifact),
  ]);
  return [...artifacts]
    .map((artifact) => {
      const landings = landingsByArtifact[artifact] ?? 0;
      const views =
        artifact in viewsByArtifact ? viewsByArtifact[artifact] : null;
      return {
        artifact,
        label: artifactLabel(artifact),
        landings,
        views,
        ctrPct: views === null ? null : ratePct(landings, views),
      };
    })
    .sort((a, b) => b.landings - a.landings);
}
