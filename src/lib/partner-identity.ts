/**
 * Slugs and referral codes for partner records.
 *
 * A partner's slug is the path they live under (`/organizers/informa-tech`),
 * so it has to be URL-safe, stable, and unique across every partner type.
 * Both the public application form and internal setup mint these, which is
 * why the rules live here rather than in either caller.
 */

/** Longest slug we'll mint. Keeps URLs readable and fits the column. */
export const MAX_SLUG_LENGTH = 60;

/**
 * Turn a company name into a URL-safe slug.
 *
 * Returns an empty string for a name with nothing slug-able in it (e.g. "!!!"),
 * so callers can fall back rather than writing an empty path segment.
 */
export function slugifyPartnerName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    // Drop the accents NFKD just split off, so "Präzision Events" slugs to
    // "prazision-events" rather than losing the letter entirely.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-$/, "");
}

/**
 * The first slug in the `base`, `base-2`, `base-3` … series that nobody has
 * taken. Suffixing rather than rejecting means an admin adding a second
 * "Informa Tech" never has to invent a name the business doesn't use.
 */
export function nextAvailableSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, (s) => s.toLowerCase()));
  if (!used.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  // Practically unreachable; a timestamp beats throwing on a setup form.
  return `${base}-${Date.now()}`;
}

/**
 * Generate a partner referral code, e.g. "BB-INFORMATK3Q" from "Informa Tech".
 *
 * The random tail is what makes the code unique — the readable head is only
 * there so someone reading a link in a spreadsheet can tell whose it is.
 */
export function generatePartnerCode(
  name: string,
  randomSuffix: () => string = () => Math.random().toString(36).slice(2, 5)
): string {
  const head = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return `BB-${head || "PARTNER"}${randomSuffix().toUpperCase()}`;
}
