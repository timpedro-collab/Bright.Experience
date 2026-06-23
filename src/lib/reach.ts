/**
 * Projected-reach model for the recommendation quiz and tailored proposal.
 *
 * Two tracks, two shapes of math:
 *
 *  - Tradeshow / exhibition / conference: reach scales off the *attendee*
 *    count the customer gives us. Every attendee who passes the stand is
 *    exposed across all of the unit's ad surfaces.
 *
 *  - Experiential activation: reach scales off a *site's real daily footfall*
 *    and a pass-rate (the share of that footfall who come within sight of the
 *    unit). This also yields an out-of-home (DOOH) media value — the open-
 *    market cost of buying the equivalent impressions on that site's screens.
 *
 * The Bright frozen vending unit carries three ad surfaces — a main front
 * touchscreen plus two non-touch side screens that play rolling adverts —
 * so every exposure counts across `SCREEN_MULTIPLIER` screens.
 *
 * Pure module: numbers in, numbers out, no I/O. Money is returned in integer
 * cents to match the app-wide currency convention (see `src/lib/currency.ts`).
 */
import { DEFAULT_CONVERSION_RATE } from "./roi";

/**
 * Ad surfaces on the Bright frozen unit: 1 front touchscreen + 2 side
 * screens, all running the brand's creative. Multiplies raw exposures.
 */
export const SCREEN_MULTIPLIER = 3;

/** Lead opt-in rate as a fraction (DEFAULT_CONVERSION_RATE is a %). */
const LEAD_RATE = DEFAULT_CONVERSION_RATE / 100;

/**
 * Share of a site's daily reach who stop to actively play in an experiential
 * setting. Commuters are a tougher, faster-moving crowd than a captive
 * tradeshow audience, so this is deliberately conservative.
 */
export const EXPERIENTIAL_PLAY_RATE = 0.06;

/**
 * Realistic ceiling on completed plays for a *single* Bright unit per active
 * day (~200–250 in the field). Impressions scale with the crowd, but plays are
 * bounded by what one machine can physically serve — so we cap them here to
 * keep the numbers defensible in a sales conversation.
 */
export const PLAYS_PER_DAY = 220;

/** Days we assume for a tradeshow run when the quiz doesn't capture them. */
const DEFAULT_TRADESHOW_DAYS = 2;

export type ReachTrack = "tradeshow" | "experiential";

export interface ReachResult {
  track: ReachTrack;
  /** Total ad impressions across all screens for the whole run. */
  impressions: number;
  /** People who actively engaged (completed a play). */
  interactions: number;
  /** Opted-in leads. */
  leads: number;
  /** People exposed per day (experiential only). */
  dailyReach?: number;
  /** Equivalent open-market OOH media value, in integer USD cents (experiential only). */
  doohMediaValueCents?: number;
}

export interface TradeshowReachInput {
  /** Expected attendees across the run. */
  attendees: number;
  /** Ad surfaces in play; defaults to the frozen 3-screen unit. */
  screens?: number;
}

/** Tradeshow track: reach derives from the attendee count. */
export function tradeshowReach({
  attendees,
  screens = SCREEN_MULTIPLIER,
}: TradeshowReachInput): ReachResult {
  const a = Math.max(0, Math.round(attendees || 0));
  const impressions = Math.round(a * screens);
  // Plays are bounded by one unit's throughput, not raw attendance.
  const interactions = Math.min(a, PLAYS_PER_DAY * DEFAULT_TRADESHOW_DAYS);
  const leads = Math.round(interactions * LEAD_RATE);
  return { track: "tradeshow", impressions, interactions, leads };
}

export interface ExperientialReachInput {
  /** Real daily footfall at the activation site. */
  dailyFootfall: number;
  /** Fraction of that footfall who pass within sight of the unit (0–1). */
  passRate: number;
  /** Days on site. */
  days: number;
  /** Site CPM — cost per 1,000 OOH impressions, in whole USD dollars. */
  cpm: number;
  /** Ad surfaces in play; defaults to the frozen 3-screen unit. */
  screens?: number;
  /** Share of daily reach who stop to interact; defaults to the commuter rate. */
  playRate?: number;
}

/** Experiential track: reach derives from a site's daily footfall + pass-rate. */
export function experientialReach({
  dailyFootfall,
  passRate,
  days,
  cpm,
  screens = SCREEN_MULTIPLIER,
  playRate = EXPERIENTIAL_PLAY_RATE,
}: ExperientialReachInput): ReachResult {
  const safeDays = Math.max(1, Math.round(days || 1));
  const dailyReach = Math.round(Math.max(0, dailyFootfall || 0) * clampFraction(passRate));
  const impressions = Math.round(dailyReach * screens * safeDays);
  // Footfall sets the eyeball impressions; completed plays are capped by what a
  // single unit can serve per day, so leads stay grounded regardless of site.
  const footfallPlays = dailyReach * clampFraction(playRate) * safeDays;
  const interactions = Math.round(Math.min(footfallPlays, PLAYS_PER_DAY * safeDays));
  const leads = Math.round(interactions * LEAD_RATE);
  const doohMediaValueCents = Math.round((impressions / 1000) * Math.max(0, cpm || 0) * 100);
  return {
    track: "experiential",
    impressions,
    interactions,
    leads,
    dailyReach,
    doohMediaValueCents,
  };
}

function clampFraction(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
