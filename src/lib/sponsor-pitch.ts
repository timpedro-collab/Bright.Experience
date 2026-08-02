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
