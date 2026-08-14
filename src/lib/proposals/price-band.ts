import { formatMoneyFromPence } from "@/lib/currency";

/**
 * Indicative price band shown on the proposal before the walkthrough call.
 *
 * The exact figure stays gated behind the walkthrough (call-first pricing),
 * but a guide band removes the "book a call to unlock the number" feeling:
 * the customer can budget-check without us giving away the tailored figure.
 *
 * The band brackets the real fee asymmetrically (-10% / +15%) and snaps to
 * round money so it reads as a genuine estimate, not a thin disguise of the
 * exact number.
 */

export interface PriceBand {
  /** Lower bound in integer pence. */
  lowPence: number;
  /** Upper bound in integer pence. */
  highPence: number;
}

/** Rounding step: £1,000 for larger fees, £500 below £10k, £100 below £2k. */
function stepFor(feePence: number): number {
  if (feePence >= 1_000_000) return 100_000; // ≥ £10k → £1,000 steps
  if (feePence >= 200_000) return 50_000; // ≥ £2k  → £500 steps
  return 10_000; // small fees → £100 steps
}

/**
 * Compute the indicative band for a fee, or null when there is no usable fee
 * (zero/negative — e.g. the AE hasn't priced the quote yet).
 */
export function indicativePriceBand(feePence: number): PriceBand | null {
  if (!Number.isFinite(feePence) || feePence <= 0) return null;

  const step = stepFor(feePence);
  const lowPence = Math.max(step, Math.floor((feePence * 0.9) / step) * step);
  const highPence = Math.ceil((feePence * 1.15) / step) * step;

  // Degenerate case (tiny fees can snap to the same bound) — widen one step.
  if (highPence <= lowPence) {
    return { lowPence, highPence: lowPence + step };
  }
  return { lowPence, highPence };
}

/** Format a band as customer-facing copy, e.g. "£22,000–£30,000". */
export function formatPriceBand(band: PriceBand): string {
  return `${formatMoneyFromPence(band.lowPence)}–${formatMoneyFromPence(band.highPence)}`;
}
