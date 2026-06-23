/**
 * Currency formatting — single source of truth.
 *
 * Convention: ALL money is stored as integer cents (USD minor units)
 * throughout the data layer (packages, quotes, line items, reports,
 * commissions, invoices, venue/sponsorship pricing, studio costs). Format for
 * display with the helpers below so the symbol, locale, and unit conversion
 * live in exactly one place.
 */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const USD_WITH_CENTS = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a whole-dollar amount, e.g. formatUSD(1234) -> "$1,234". */
export function formatUSD(dollars: number): string {
  return USD.format(Math.round(dollars));
}

/** Format integer cents, e.g. formatUSDFromCents(123456) -> "$1,235" (or "$1,234.56" with decimals). */
export function formatUSDFromCents(cents: number, opts?: { decimals?: boolean }): string {
  const dollars = (cents ?? 0) / 100;
  return (opts?.decimals ? USD_WITH_CENTS : USD).format(dollars);
}

/** Format a plain number with en-US grouping, e.g. 12345 -> "12,345". */
export function formatNumberUS(value: number): string {
  return value.toLocaleString("en-US");
}
