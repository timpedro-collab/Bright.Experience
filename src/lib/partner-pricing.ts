/**
 * Buyer-safe deal maths for the NRS partner pricing microsite (`/pp/:slug`).
 *
 * The generic engine lives in `@/lib/deal-config`; this module pins the
 * NRS/Informa deal's numbers and preserves the original named API used by
 * the NRS components and tests. `NRS_DEAL_CONFIG` is the same deal
 * expressed as a data-driven `DealConfig` (and is what the seeded
 * `partner_pricing_pages` row carries).
 *
 * IMPORTANT: this module ships to the client on a page shared with an
 * external negotiating counterparty. It may only contain numbers that
 * appear in the pitch deck — retail anchors, the revenue split, the floor
 * ladder and commitment terms. Internal economics (unit costs, margins,
 * the wholesale reserve, concession lines) must NEVER enter this file.
 */

import {
  computeConfigDeal,
  clampRetail,
  formatDealCurrency,
  formatDealCurrencyCompact,
  floorTierForVolume as configFloorTierForVolume,
  type DealConfig,
} from "@/lib/deal-config";

export { clampRetail };

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
  /**
   * Corridor placements: the stated Model 1 pilot. Physically capped — the
   * campus has two connecting corridors, two machines each. Priced under the
   * single band; placement rights (MPEA) are agreed separately.
   */
  corridor: { min: 25_000, max: 40_000, suggested: 30_000, step: 1_000, maxUnits: 4 },
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

/** The NRS/Informa deal expressed as a data-driven config. */
export const NRS_DEAL_CONFIG: DealConfig = {
  currency: "USD",
  split: REVENUE_SPLIT,
  commitment: COMMITMENT,
  levers: [
    {
      key: "single",
      label: "Single-unit placements",
      unitsPerItem: 1,
      retail: {
        min: RETAIL.single.min,
        max: RETAIL.single.max,
        suggested: RETAIL.single.suggested,
        step: RETAIL.single.step,
      },
    },
    {
      key: "takeover",
      label: "Cross-Hall Takeover bundles (3 units each)",
      unitsPerItem: RETAIL.takeover.unitsPerBundle,
      maxItems: RETAIL.takeover.maxBundles,
      retail: {
        min: RETAIL.takeover.min,
        max: RETAIL.takeover.max,
        suggested: RETAIL.takeover.suggested,
        step: RETAIL.takeover.step,
      },
    },
    {
      key: "corridor",
      label: "Corridor placements",
      unitsPerItem: 1,
      maxItems: RETAIL.corridor.maxUnits,
      retail: {
        min: RETAIL.corridor.min,
        max: RETAIL.corridor.max,
        suggested: RETAIL.corridor.suggested,
        step: RETAIL.corridor.step,
      },
    },
  ],
  floorTiers: FLOOR_TIERS.map((t) => ({ ...t })),
};

/** The floor tier a given deployed-unit count lands in. */
export function floorTierForVolume(totalUnits: number): FloorTier {
  const tier = configFloorTierForVolume(NRS_DEAL_CONFIG, totalUnits);
  // The config tiers are copies of FLOOR_TIERS; return the canonical
  // constant so callers can compare by reference/label as before.
  return FLOOR_TIERS.find((t) => t.label === tier.label) ?? FLOOR_TIERS[FLOOR_TIERS.length - 1];
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

/** Compute the partner-facing economics for a given inventory mix. */
export function computeDeal(inputs: DealInputs): DealSummary {
  const summary = computeConfigDeal(NRS_DEAL_CONFIG, {
    single: { count: inputs.singles, retail: inputs.singleRetail },
    takeover: { count: inputs.takeovers, retail: inputs.takeoverRetail },
    corridor: { count: inputs.corridors, retail: inputs.corridorRetail },
  });
  return { ...summary, tier: floorTierForVolume(summary.totalUnits) };
}

/** "$45,000" — whole-dollar USD for the pricing surfaces. */
export function formatUsd(value: number): string {
  return formatDealCurrency("USD", value);
}

/**
 * "$450k" / "$19.6k" / "$1.2m" — compact USD for stat headlines.
 * Sub-$100k values keep one decimal so derived figures stay consistent
 * with their totals (e.g. $392k across 20 machines is $19.6k, not $20k).
 */
export function formatUsdCompact(value: number): string {
  return formatDealCurrencyCompact("USD", value);
}
