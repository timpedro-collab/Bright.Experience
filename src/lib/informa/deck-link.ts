/**
 * Return-to-deck link building for the Informa suite's satellite pages
 * (seller's kit, sample report). The deck keeps its position in a
 * ?slide= param; outbound links carry it here so "Back to the deck"
 * reopens the exact slide the reader left instead of restarting the deck.
 */

/**
 * The href for "Back to the deck", honouring a `slide` query param carried
 * over from the deck. Anything non-numeric (or a missing param, e.g. when
 * the page was opened from a shared link) falls back to the deck cover;
 * the deck itself clamps out-of-range values.
 */
export function deckBackHref(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const raw = searchParams.slide;
  const slide = Array.isArray(raw) ? raw[0] : raw;
  return slide && /^\d{1,3}$/.test(slide) ? `/informa?slide=${slide}` : "/informa";
}
