/**
 * Engaged minutes — the experiential currency (Stage 5, docs/19 §agencies).
 *
 * A play is a fact; a minute of voluntary brand attention is a story a CMO
 * can retell. Engaged minutes = plays × average session length, so it uses
 * only telemetry we already trust — no modelling, no reach multipliers.
 */

/** Total engaged minutes, or null when either input is unusable. */
export function engagedMinutes(
  plays: number,
  avgDwellSeconds: number | null,
): number | null {
  if (!Number.isFinite(plays) || plays <= 0) return null;
  if (avgDwellSeconds == null || !Number.isFinite(avgDwellSeconds)) return null;
  if (avgDwellSeconds <= 0) return null;
  return Math.round((plays * avgDwellSeconds) / 60);
}

/**
 * Human form: minutes below two hours, hours above ("1,240 engaged minutes",
 * "20.7 hours of brand attention").
 */
export function formatEngagedMinutes(minutes: number): string {
  if (minutes >= 120) {
    const hours = minutes / 60;
    const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
    return `${rounded.toLocaleString("en-GB")} hours of brand attention`;
  }
  return `${minutes.toLocaleString("en-GB")} engaged minutes`;
}

/** Pence per engaged minute — the CFO-grade unit cost. Null when unpriceable. */
export function costPerEngagedMinutePence(
  totalPricePence: number | null,
  minutes: number | null,
): number | null {
  if (totalPricePence == null || totalPricePence <= 0) return null;
  if (minutes == null || minutes <= 0) return null;
  return Math.round(totalPricePence / minutes);
}
