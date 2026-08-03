/**
 * Cost-per-lead arithmetic for the business-case page: what a tier's price
 * band works out to per opted-in lead at a given capture volume. Pure math
 * over the canonical tier bands — the framing evidence lives in docs/20 §1.
 */
import {
  formatBandAmount,
  type PriceRegion,
  type PricingTier,
} from "@/lib/pricing/tiers";

export interface CplBand {
  /** Cost per lead at the bottom of the tier's price band, in minor units. */
  lowMinor: number;
  /** Cost per lead at the top of the tier's price band, in minor units. */
  highMinor: number;
}

/**
 * Cost-per-lead band for a tier at a given lead volume. Returns null for
 * open-ended (bespoke) bands and non-positive lead counts, where the
 * arithmetic would mislead.
 */
export function cplBand(
  tier: PricingTier,
  region: PriceRegion,
  leads: number,
): CplBand | null {
  const band = tier.bands[region];
  if (band.highMinor === null || leads <= 0) return null;
  return {
    lowMinor: Math.round(band.lowMinor / leads),
    highMinor: Math.round(band.highMinor / leads),
  };
}

/** "£53–£80 per lead" — whole major units, en-dash, region currency. */
export function formatCplBand(
  tier: PricingTier,
  region: PriceRegion,
  leads: number,
): string | null {
  const cpl = cplBand(tier, region, leads);
  if (!cpl) return null;
  const currency = tier.bands[region].currency;
  const low = formatBandAmount(currency, cpl.lowMinor);
  const high = formatBandAmount(currency, cpl.highMinor);
  return low === high ? `${low} per lead` : `${low}–${high} per lead`;
}
