/**
 * Shared engagement constants + the legacy money formatter.
 *
 * The speculative "ROI / impact calculator" has been removed from the portal —
 * we report real, measured outcomes in the live and post-show reports instead
 * of projecting a return before a campaign runs.
 *
 * What remains here is intentionally small:
 *  - `DEFAULT_CONVERSION_RATE` — the opt-in rate the reach model reuses.
 *  - `formatGBP` — the legacy money-format name, re-exported from the central
 *    currency module so existing call sites keep working.
 */

/** Default opt-in rate (% of plays that capture a lead). */
export const DEFAULT_CONVERSION_RATE = 90;

/**
 * Format a whole-dollar amount as USD, no decimals.
 * Re-exported from the central currency module; kept here under the legacy
 * name so existing call sites continue to work.
 */
export { formatUSD, formatUSD as formatGBP } from "./currency";
