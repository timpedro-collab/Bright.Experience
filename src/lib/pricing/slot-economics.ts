/**
 * Slot economics — rack / wholesale / margin arithmetic for sponsorship
 * slots (docs/20 §4: organizer wholesale is rack −20–25%).
 *
 * `price` on a slot is the sponsor-facing figure the organizer set;
 * `wholesale_price` is what Bright.Blue invoices the organizer. The spread
 * is the organizer's margin — surfaced in the sponsor book and summed into
 * the earnings dashboard. All amounts are integer minor units.
 */

/** Default wholesale discount off rack (docs/20 §4 deep end). */
export const DEFAULT_WHOLESALE_DISCOUNT = 0.25;

/**
 * Suggested wholesale figure for a sponsor-facing price: rack −25%,
 * rounded to the nearest £50/€50/$50 so it reads like a price, not a
 * calculation.
 */
export function suggestedWholesalePence(rackPence: number): number {
  const raw = rackPence * (1 - DEFAULT_WHOLESALE_DISCOUNT);
  return Math.round(raw / 5000) * 5000;
}

export interface SlotEconomics {
  rackPence: number | null;
  wholesalePence: number | null;
  /** Organizer's margin; null when either side of the spread is unset. */
  marginPence: number | null;
  /** Margin as a share of the sponsor-facing price, 0–1; null when unknowable. */
  marginRatio: number | null;
}

/** Derive the economics of one slot from its two price columns. */
export function slotEconomics(input: {
  pricePence?: number | null;
  wholesalePence?: number | null;
}): SlotEconomics {
  const rack =
    typeof input.pricePence === "number" && Number.isFinite(input.pricePence)
      ? input.pricePence
      : null;
  const wholesale =
    typeof input.wholesalePence === "number" &&
    Number.isFinite(input.wholesalePence)
      ? input.wholesalePence
      : null;

  const margin = rack !== null && wholesale !== null ? rack - wholesale : null;
  const ratio = margin !== null && rack !== null && rack > 0 ? margin / rack : null;

  return {
    rackPence: rack,
    wholesalePence: wholesale,
    marginPence: margin,
    marginRatio: ratio,
  };
}

/** "35%" — margin ratio as it reads in a table cell; null-safe. */
export function formatMarginRatio(ratio: number | null): string | null {
  if (ratio === null || !Number.isFinite(ratio)) return null;
  return `${Math.round(ratio * 100)}%`;
}
