/**
 * Weekly DOOH media-value framing for a venue's live placement inventory.
 *
 * Sums the open-market equivalent across placements that carry a real
 * footfall estimate — the same reach engine as the sponsor pitch page,
 * held to a seven-day window for the advertise hero.
 */
import { experientialReach } from "@/lib/reach";
import { cpmForTier } from "@/lib/pricing/dooh-cpm";

export interface PlacementFootfallInput {
  footfallEstimate: number | null | undefined;
}

/**
 * Total weekly DOOH media value across live placements, in integer USD cents.
 * Returns null when no placement has footfall — callers omit the hero stat.
 */
export function weeklyVenueMediaValueCents(
  placements: PlacementFootfallInput[],
  venueTier: string | null | undefined,
): number | null {
  const cpm = cpmForTier(venueTier);
  let total = 0;
  let counted = 0;

  for (const placement of placements) {
    const footfall = Number(placement.footfallEstimate);
    if (!Number.isFinite(footfall) || footfall <= 0) continue;

    const reach = experientialReach({
      dailyFootfall: footfall,
      passRate: 0.3,
      days: 7,
      cpm,
    });
    total += reach.doohMediaValueCents ?? 0;
    counted += 1;
  }

  return counted > 0 ? total : null;
}
