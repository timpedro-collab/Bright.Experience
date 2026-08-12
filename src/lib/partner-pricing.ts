/**
 * Buyer-safe deal maths for the partner pricing microsite (`/pp/:slug`).
 *
 * IMPORTANT: this module ships to the client on a page shared with an
 * external negotiating counterparty. It may only contain numbers that
 * appear in the pitch deck — retail anchors, the revenue split, the floor
 * ladder and commitment terms. Internal economics (unit costs, margins,
 * the wholesale reserve, concession lines) must NEVER enter this file.
 */

/** Revenue split on partner-sold placements: Bright.Blue 70 / partner 30. */
export const REVENUE_SPLIT = { brightBlue: 0.7, partner: 0.3 } as const;

/** Pilot commitment: take-or-pay band and the volume ceiling. */
export const COMMITMENT = {
  pilotMinUnits: 12,
  pilotMaxUnits: 15,
  maxUnits: 50,
  /** Weeks before the show by which scale volumes must be committed. */
  cutoffWeeks: 25,
} as const;

/**
 * Suggested retail bounds — sliders must never go below the minimums.
 * Top of band prices the audience gap vs the HIMSS precedent (a basic
 * wrapped vendor at a ~30k-attendee show fetches $45k; NRS is 55k+) plus
 * premium positioning. Takeover ceiling = 3 × $70k less a ~17% bundle
 * discount.
 */
export const RETAIL = {
  single: { min: 45_000, max: 70_000, suggested: 50_000, step: 1_000 },
  /** Cross-Hall Takeover: 3 units (booth + 2 halls), scarcity-capped. */
  takeover: { min: 110_000, max: 175_000, suggested: 120_000, step: 5_000, unitsPerBundle: 3, maxBundles: 3 },
  /** Corridor placements: new inventory, priced under the single band to move. */
  corridor: { min: 25_000, max: 40_000, suggested: 30_000, step: 1_000 },
} as const;

/**
 * Per-unit floor ladder. The split never moves with volume — scale is
 * rewarded through the floor because delivery economics genuinely improve.
 */
export const FLOOR_TIERS = [
  { label: "Pilot", minUnits: 1, maxUnits: 15, floor: 15_000 },
  { label: "Scale", minUnits: 16, maxUnits: 30, floor: 13_500 },
  { label: "Portfolio", minUnits: 31, maxUnits: 50, floor: 12_000 },
] as const;

export type FloorTier = (typeof FLOOR_TIERS)[number];

/** The floor tier a given deployed-unit count lands in. */
export function floorTierForVolume(totalUnits: number): FloorTier {
  const clamped = Math.max(1, Math.min(totalUnits, COMMITMENT.maxUnits));
  return (
    FLOOR_TIERS.find((t) => clamped >= t.minUnits && clamped <= t.maxUnits) ??
    FLOOR_TIERS[FLOOR_TIERS.length - 1]
  );
}

export interface DealInputs {
  /** Single-unit placements sold. */
  singles: number;
  /** Retail per single placement (USD). */
  singleRetail: number;
  /** Cross-Hall Takeover bundles sold (3 units each). */
  takeovers: number;
  /** Retail per takeover bundle (USD). */
  takeoverRetail: number;
  /** Corridor placements sold. */
  corridors: number;
  /** Retail per corridor placement (USD). */
  corridorRetail: number;
}

export interface DealSummary {
  /** Machines on the floor: singles + corridors + 3 per takeover bundle. */
  totalUnits: number;
  /** Partner's gross sponsorship revenue (USD). */
  gross: number;
  /** Partner's 30% retained share (USD). */
  partnerKeeps: number;
  /** Bright.Blue's 70% share (USD). */
  brightBlueShare: number;
  /** Average retained revenue per deployed unit (USD, 0-safe). */
  partnerKeepsPerUnit: number;
  /** Floor tier the volume lands in (drives the ladder display). */
  tier: FloorTier;
  /** True when volume is below the take-or-pay pilot minimum. */
  belowPilotMinimum: boolean;
}

/** Clamp a retail value into its allowed band — floors are non-negotiable. */
export function clampRetail(value: number, bounds: { min: number; max: number }): number {
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

/** Compute the partner-facing economics for a given inventory mix. */
export function computeDeal(inputs: DealInputs): DealSummary {
  const singles = Math.max(0, Math.floor(inputs.singles));
  const takeovers = Math.max(0, Math.min(Math.floor(inputs.takeovers), RETAIL.takeover.maxBundles));
  const corridors = Math.max(0, Math.floor(inputs.corridors));
  const singleRetail = clampRetail(inputs.singleRetail, RETAIL.single);
  const takeoverRetail = clampRetail(inputs.takeoverRetail, RETAIL.takeover);
  const corridorRetail = clampRetail(inputs.corridorRetail, RETAIL.corridor);

  const totalUnits = singles + corridors + takeovers * RETAIL.takeover.unitsPerBundle;
  const gross =
    singles * singleRetail +
    corridors * corridorRetail +
    takeovers * takeoverRetail;
  const partnerKeeps = Math.round(gross * REVENUE_SPLIT.partner);
  const brightBlueShare = gross - partnerKeeps;

  return {
    totalUnits,
    gross,
    partnerKeeps,
    brightBlueShare,
    partnerKeepsPerUnit: totalUnits > 0 ? Math.round(partnerKeeps / totalUnits) : 0,
    tier: floorTierForVolume(totalUnits),
    belowPilotMinimum: totalUnits > 0 && totalUnits < COMMITMENT.pilotMinUnits,
  };
}

/** "$45,000" — whole-dollar USD for the pricing surfaces. */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * "$450k" / "$19.6k" / "$1.2m" — compact USD for stat headlines.
 * Sub-$100k values keep one decimal so derived figures stay consistent
 * with their totals (e.g. $392k across 20 machines is $19.6k, not $20k).
 */
export function formatUsdCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (Math.abs(value) >= 1_000) {
    const k =
      Math.abs(value) < 100_000
        ? Math.round(value / 100) / 10
        : Math.round(value / 1_000);
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return formatUsd(value);
}
