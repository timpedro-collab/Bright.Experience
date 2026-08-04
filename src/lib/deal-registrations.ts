/**
 * Deal registration vocabulary + window arithmetic.
 *
 * An organizer registers a sponsor conversation; once we approve it, they
 * hold a 14-day exclusivity window on that sponsor — a direct enquiry from
 * the same company inside the window is routed back to the organizer. This
 * is the mechanism that makes public rack pricing safe for the channel
 * (docs/20 §4).
 */

export type DealRegistrationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "converted"
  | "expired";

export type DealRegistrationSource = "organizer" | "reverse";

export const DEAL_EXCLUSIVITY_DAYS = 14;

/** How long Bright.Blue has to review a registration before it's overdue. */
export const DEAL_SLA_HOURS = 24;

export interface DealRegistration {
  id: string;
  partnerId: string;
  eventId: string | null;
  sponsorCompany: string;
  sponsorContactName: string | null;
  sponsorContactEmail: string | null;
  /** Integer minor units. */
  estimatedValue: number | null;
  notes: string | null;
  status: DealRegistrationStatus;
  exclusivityExpiresAt: string | null;
  source: DealRegistrationSource;
  quoteId: string | null;
  rejectedReason: string | null;
  approvedAt: string | null;
  createdAt: string;
}

/**
 * Canonical form for duplicate matching: case/whitespace-insensitive, with
 * trailing corporate suffixes dropped so "Acme Ltd" and "ACME limited"
 * collide.
 */
export function normaliseCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(ltd|limited|inc|incorporated|llc|plc|gmbh|co|corp|corporation)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True while an approved registration's exclusivity window is open. */
export function isExclusivityActive(
  status: DealRegistrationStatus,
  exclusivityExpiresAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (status !== "approved" || !exclusivityExpiresAt) return false;
  const expiry = Date.parse(exclusivityExpiresAt);
  return !Number.isNaN(expiry) && expiry > now.getTime();
}

/** Whole days left on the exclusivity window, clamped at 0. */
export function exclusivityDaysRemaining(
  exclusivityExpiresAt: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!exclusivityExpiresAt) return null;
  const expiry = Date.parse(exclusivityExpiresAt);
  if (Number.isNaN(expiry)) return null;
  const ms = expiry - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

/** The exclusivity expiry for an approval granted now. */
export function exclusivityExpiry(
  days: number = DEAL_EXCLUSIVITY_DAYS,
  from: Date = new Date(),
): string {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

/** Customer-facing status labels for the deals board. */
export const DEAL_STATUS_LABELS: Record<DealRegistrationStatus, string> = {
  pending: "Awaiting review",
  approved: "Registered to you",
  rejected: "Not registered",
  converted: "Won",
  expired: "Window closed",
};

export function isDealRegistrationStatus(
  value: string,
): value is DealRegistrationStatus {
  return value in DEAL_STATUS_LABELS;
}

/**
 * The status a registration effectively holds right now: an `approved`
 * registration whose window has lapsed reads as `expired` without waiting
 * for a cron to rewrite the row.
 */
export function effectiveDealStatus(
  status: DealRegistrationStatus,
  exclusivityExpiresAt: string | null | undefined,
  now: Date = new Date(),
): DealRegistrationStatus {
  if (status !== "approved") return status;
  return isExclusivityActive(status, exclusivityExpiresAt, now)
    ? status
    : "expired";
}
