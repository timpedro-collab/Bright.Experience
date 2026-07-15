/**
 * Currency formatting — single source of truth.
 *
 * Convention: ALL money is stored as integer pence (GBP minor units)
 * throughout the data layer (packages, quotes, line items, reports,
 * commissions, invoices, venue/sponsorship pricing, studio costs). Format for
 * display with the helpers below so the symbol, locale, and unit conversion
 * live in exactly one place.
 *
 * Bright.Experience is a UK product (VAT-exclusive prices in Studio copy).
 */

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const GBP_WITH_PENCE = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a whole-pound amount, e.g. formatGBP(1234) -> "£1,234". */
export function formatGBP(pounds: number): string {
  return GBP.format(Math.round(pounds));
}

/**
 * Format integer pence as pounds, e.g. formatMoneyFromPence(123456) -> "£1,235"
 * (or "£1,234.56" with decimals).
 */
export function formatMoneyFromPence(
  pence: number,
  opts?: { decimals?: boolean },
): string {
  const pounds = (pence ?? 0) / 100;
  return (opts?.decimals ? GBP_WITH_PENCE : GBP).format(pounds);
}

/**
 * @deprecated Use {@link formatMoneyFromPence}. Kept as an alias so older
 * call sites keep compiling while the codebase migrates to GBP naming.
 */
export function formatUSDFromCents(
  cents: number,
  opts?: { decimals?: boolean },
): string {
  return formatMoneyFromPence(cents, opts);
}

/** @deprecated Use {@link formatGBP}. */
export function formatUSD(dollars: number): string {
  return formatGBP(dollars);
}

/** Format a plain number with en-GB grouping, e.g. 12345 -> "12,345". */
export function formatNumberUS(value: number): string {
  return value.toLocaleString("en-GB");
}
