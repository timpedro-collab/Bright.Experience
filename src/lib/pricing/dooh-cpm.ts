/**
 * DOOH CPM benchmarks per location tier — the "what would these eyeballs
 * cost on a screen you can't touch" anchor used for media-value framing on
 * sponsorship surfaces (sponsor pitch, venue advertise page, machine PDP).
 *
 * Values are open-market rates for premium, full-motion digital OOH,
 * expressed in whole USD dollars per 1,000 impressions to match
 * `experientialReach()` in `src/lib/reach.ts` (which returns
 * `doohMediaValueCents`). They deliberately sit at or below the named-site
 * CPMs in `src/lib/experiential-locations.ts`, whose sources (ORR station
 * usage 2024–25, JCDecaux Motion@Waterloo rate positioning, URW Westfield
 * visitor reporting) ground the top of the scale:
 *
 *   - tier_1 (premium: flagship stations/malls) — named sites trade at
 *     $65–95 CPM; the tier benchmark takes the cheapest ($65) so no tier_1
 *     venue can claim more than its weakest named comparable.
 *   - tier_2 (major: regional interchanges, big retail) — named sites at
 *     $38–48; benchmark $38, same floor-of-the-evidence rule.
 *   - tier_3 (regional: high street, mid-size venues) — matches the
 *     conservative fallback already used by the quiz ($30).
 *   - tier_4 (local: community venues) — standard place-based DOOH floor,
 *     $18.
 *
 * Framing rule: media value is always shown to buyers as an "up to" /
 * "equivalent spend" ceiling, never as a promise. Kept as a code constant
 * (not DB rows) deliberately — every other CPM in the codebase lives in
 * code, and public pages stay free of an extra query + missing-seed risk.
 */

import type { LocationTierLevel } from "@/lib/experiential-locations";

/** Conservative open-market DOOH CPM per location tier, USD per 1,000. */
export const TIER_DOOH_CPM: Record<LocationTierLevel, number> = {
  tier_1: 65,
  tier_2: 38,
  tier_3: 30,
  tier_4: 18,
} as const;

/**
 * The CPM benchmark for a tier. Unknown/missing tiers fall back to the
 * tier_3 conservative figure so a mis-tagged venue can never inflate the
 * claim.
 */
export function cpmForTier(tier: string | null | undefined): number {
  if (tier && tier in TIER_DOOH_CPM) {
    return TIER_DOOH_CPM[tier as LocationTierLevel];
  }
  return TIER_DOOH_CPM.tier_3;
}
