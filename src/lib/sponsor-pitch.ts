/**
 * Sponsor pitch links and what they may expose.
 *
 * A pitch link is a capability URL: possession of the token is the whole
 * authorization. That makes two rules non-negotiable, and both are enforced
 * here rather than left to each page.
 *
 *   1. Every token expires. A link forwarded out of an inbox stops working.
 *   2. Tokened surfaces carry aggregate numbers only, never a lead row.
 *      Captured contacts belong to the brand that ran the activation, and no
 *      consent was ever given for a prospective sponsor to see them.
 */

/** How long a pitch link lives when the caller doesn't say. */
export const PITCH_TOKEN_DEFAULT_DAYS = 30;

/**
 * Cookie holding the slot ids whose detailed numbers this browser has
 * unlocked (comma-separated). Set by the unlock action, read by the page.
 */
export const PITCH_UNLOCK_COOKIE = "bb_pitch_unlock";

/** Whether a pitch's detail unlock cookie covers a given slot. */
export function isPitchUnlocked(
  cookieValue: string | null | undefined,
  slotId: string
): boolean {
  if (!cookieValue) return false;
  return cookieValue.split(",").includes(slotId);
}

/** Absolute expiry for a pitch link created now. */
export function pitchTokenExpiry(
  days: number = PITCH_TOKEN_DEFAULT_DAYS,
  from: Date = new Date()
): Date {
  const expiry = new Date(from);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Whether a token is still usable. A missing expiry is treated as expired
 * rather than eternal: fail closed, so a row written before expiries existed
 * can't quietly become a permanent public link.
 */
export function isPitchTokenValid(
  expiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() > now.getTime();
}

/** Days left on a link, floored at zero, for the "expires in N days" notice. */
export function pitchTokenDaysRemaining(
  expiresAt: string | null | undefined,
  now: Date = new Date()
): number {
  if (!isPitchTokenValid(expiresAt, now)) return 0;
  const ms = new Date(expiresAt!).getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/** Aggregate performance a sponsor may see. No contact-level fields exist here. */
export interface SponsorPerformance {
  plays: number;
  leads: number;
  prizes: number;
  /** Share of plays that ended in a captured contact, 0-100. */
  optInRate: number;
}

/**
 * Reduce raw counters to the sponsor-safe view.
 *
 * Anything not on {@link SponsorPerformance} is dropped by construction, so
 * adding a PII-bearing column upstream cannot leak onto a pitch or proof
 * page by accident.
 */
export function toSponsorPerformance(counters: {
  plays: number;
  leads: number;
  prizes: number;
}): SponsorPerformance {
  const { plays, leads, prizes } = counters;
  return {
    plays,
    leads,
    prizes,
    optInRate: plays > 0 ? Math.round((leads / plays) * 100) : 0,
  };
}

/** Aggregate pitch-link opens across sponsorship slots. */
export interface PitchTelemetrySummary {
  totalViews: number;
  lastViewedAt: string | null;
}

export function rollupPitchTelemetry(
  rows: { pitch_view_count?: number | null; pitch_last_viewed_at?: string | null }[]
): PitchTelemetrySummary {
  let totalViews = 0;
  let lastViewedAt: string | null = null;

  for (const row of rows) {
    totalViews += Number(row.pitch_view_count) || 0;
    const viewed = row.pitch_last_viewed_at ? String(row.pitch_last_viewed_at) : null;
    if (viewed && (!lastViewedAt || new Date(viewed) > new Date(lastViewedAt))) {
      lastViewedAt = viewed;
    }
  }

  return { totalViews, lastViewedAt };
}
