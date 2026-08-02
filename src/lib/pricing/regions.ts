/**
 * Resolves a country code to the price region whose published bands apply, per docs/20-pricing-and-packaging.md §3.
 */

import type { PriceRegion } from "./tiers";

export const DEFAULT_PRICE_REGION: PriceRegion = "uk";

const EU_REGION_CODES: ReadonlySet<string> = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "NO",
  "IS",
  "LI",
  "CH",
]);

/** Returns null for countries we have no published bands for (they are POA). */
export function resolvePriceRegion(
  countryCode: string | null | undefined,
): PriceRegion | null {
  if (!countryCode) return null;

  const normalized = countryCode.trim().toUpperCase();
  if (normalized.length === 0) return null;

  if (normalized === "GB" || normalized === "UK") return "uk";
  if (normalized === "US") return "us";
  if (EU_REGION_CODES.has(normalized)) return "eu";

  return null;
}

/** For surfaces that must always show a price (defaulting to UK bands). */
export function resolvePriceRegionOrDefault(
  countryCode: string | null | undefined,
): PriceRegion {
  return resolvePriceRegion(countryCode) ?? DEFAULT_PRICE_REGION;
}
