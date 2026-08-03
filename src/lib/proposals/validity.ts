/**
 * Proposal validity arithmetic — how long an issued proposal remains
 * acceptable (`quotes.expires_at`, set 14 days out by `prepareProposal`).
 * Honest urgency: we only surface a countdown that is real and enforced.
 */

/**
 * Whole days until expiry, clamped at 0. Null when no expiry is set or the
 * timestamp is unparseable. Counts calendar-day distance so "expires
 * tomorrow" reads as 1 even late in the evening.
 */
export function daysUntilExpiry(
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;
  const expiry = Date.parse(expiresAt);
  if (Number.isNaN(expiry)) return null;
  const ms = expiry - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/** Customer-facing countdown line; null when there is nothing to say. */
export function validityLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days <= 0) return "This proposal has expired";
  if (days === 1) return "Valid for 1 more day";
  return `Valid for ${days} more days`;
}
