/**
 * Placement value maths for the Informa seller's kit configurator.
 *
 * Buyer-facing: this ships to a page an Informa rep may screen-share with a
 * sponsor. It carries only the same deck-visible model the portal quiz uses
 * (screen multiplier, plays-per-day ceiling, opt-in rate) and no internal
 * economics. Everything it returns is an illustrative projection and the UI
 * labels it as such.
 *
 * Pure module: numbers in, numbers out.
 */
import { PLAYS_PER_DAY, SCREEN_MULTIPLIER } from "@/lib/reach";
import { DEFAULT_CONVERSION_RATE } from "@/lib/roi";

/**
 * Low end of the illustrative plays band, as a share of the physical ceiling.
 * Quiet placements and short opening hours land below the cap; this keeps the
 * quoted range honest instead of quoting the ceiling as a promise.
 */
const CONSERVATIVE_PLAY_FACTOR = 0.7;

/** Opt-in rate as a fraction (DEFAULT_CONVERSION_RATE is a %). */
const OPT_IN_RATE = DEFAULT_CONVERSION_RATE / 100;

export interface PlacementInputs {
  /** Expected attendees across the run. */
  attendees: number;
  /** Show days the machine is live. */
  days: number;
  /** Sponsor price for the placement, whole USD. */
  priceUsd: number;
}

export interface PlacementValue {
  /** Total ad impressions across the unit's screens for the run. */
  impressions: number;
  /** Completed plays, illustrative range for the run. */
  playsLow: number;
  playsHigh: number;
  /** Opted-in leads, illustrative range for the run. */
  leadsLow: number;
  leadsHigh: number;
  /** Sponsor cost per opted-in lead, whole USD (low uses the high lead count). */
  costPerLeadLow: number | null;
  costPerLeadHigh: number | null;
  /** Sponsor cost per completed play, whole USD (low uses the high play count). */
  costPerPlayLow: number | null;
  costPerPlayHigh: number | null;
}

/**
 * Project what a placement creates for a sponsor at a given show size, run
 * length and price. Plays are bounded by one machine's physical throughput
 * (the same cap the portal's reach model uses), never by optimism.
 */
export function placementValue({
  attendees,
  days,
  priceUsd,
}: PlacementInputs): PlacementValue {
  const a = Math.max(0, Math.round(attendees || 0));
  const d = Math.max(1, Math.round(days || 1));
  const price = Math.max(0, Math.round(priceUsd || 0));

  const impressions = a * SCREEN_MULTIPLIER;

  const playsHigh = Math.min(a, PLAYS_PER_DAY * d);
  const playsLow = Math.round(playsHigh * CONSERVATIVE_PLAY_FACTOR);

  const leadsHigh = Math.round(playsHigh * OPT_IN_RATE);
  const leadsLow = Math.round(playsLow * OPT_IN_RATE);

  return {
    impressions,
    playsLow,
    playsHigh,
    leadsLow,
    leadsHigh,
    costPerLeadLow: perUnit(price, leadsHigh),
    costPerLeadHigh: perUnit(price, leadsLow),
    costPerPlayLow: perUnit(price, playsHigh),
    costPerPlayHigh: perUnit(price, playsLow),
  };
}

/** Whole-dollar cost per unit, or null when the divisor is zero. */
function perUnit(priceUsd: number, count: number): number | null {
  if (count <= 0 || priceUsd <= 0) return null;
  return Math.round(priceUsd / count);
}

/** Compact "12,400" formatting for counts. */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

/** "$18,000" for placement prices, "$29" for per-lead costs. */
export function formatUsdWhole(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}
