/**
 * Slot holds — a `reserved` sponsorship slot with a future `hold_expires_at`
 * is held for a named sponsor while the deal closes. Expiry is computed at
 * read time (no cron): an expired hold reads as available again.
 */

/** Standard hold window, matching the deal-registration exclusivity window. */
export const SLOT_HOLD_DEFAULT_DAYS = 14;

/** True while a reserved slot's hold window is still open. */
export function isHoldActive(
  status: string,
  holdExpiresAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (status !== "reserved" || !holdExpiresAt) return false;
  const expiry = Date.parse(holdExpiresAt);
  return !Number.isNaN(expiry) && expiry > now.getTime();
}

/** Whole days left on a hold, clamped at 0; null when no hold is set. */
export function holdDaysRemaining(
  holdExpiresAt: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!holdExpiresAt) return null;
  const expiry = Date.parse(holdExpiresAt);
  if (Number.isNaN(expiry)) return null;
  const ms = expiry - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

/** The expiry timestamp for a hold placed now. */
export function holdExpiry(
  days: number = SLOT_HOLD_DEFAULT_DAYS,
  from: Date = new Date(),
): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}
