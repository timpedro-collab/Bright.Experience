/**
 * The volume ladder — the price of growth, written down.
 *
 * Mirrors the floor-ladder mechanic proven on the partner pricing microsite
 * (`src/lib/deal-config.ts`), applied to the customer quote model: a brand
 * that commits to more activations in a program year earns a written-down
 * discount rung, so scaling never reopens the negotiation. The ladder is
 * shown post-reveal on proposals and on the internal quote builder so AEs
 * quote against it.
 *
 * ALL DISCOUNT VALUES ARE PLACEHOLDERS pending owner sign-off (see
 * OWNER-TODO.md "Pricing & packaging"). The shape ships now so the surfaces
 * exist; the numbers are a one-line edit here when signed off.
 */

/** One rung of the multi-event volume ladder. */
export interface VolumeRung {
  label: string;
  /** Inclusive lower bound on activations in the program year. */
  minEvents: number;
  /** Inclusive upper bound; null = open-ended top rung. */
  maxEvents: number | null;
  /**
   * Written-down discount off the quoted package fee, as a fraction
   * (0.05 = 5%). PLACEHOLDER values pending owner sign-off.
   */
  discount: number;
}

/**
 * Canonical ladder, ascending. Rung labels are buyer-facing.
 * PLACEHOLDER discounts — evidence rationale: delivery economics genuinely
 * improve with committed volume (crew scheduling, wrap reuse, freight
 * consolidation), the same argument that priced the partner floor ladder.
 */
export const VOLUME_LADDER: ReadonlyArray<VolumeRung> = [
  { label: "First activation", minEvents: 1, maxEvents: 1, discount: 0 },
  { label: "Events 2–3", minEvents: 2, maxEvents: 3, discount: 0.05 },
  { label: "Events 4+", minEvents: 4, maxEvents: null, discount: 0.1 },
] as const;

/** The rung a given committed-event count lands in. */
export function rungForEventCount(eventCount: number): VolumeRung {
  const clamped = Math.max(1, Math.floor(eventCount || 1));
  return (
    VOLUME_LADDER.find(
      (r) =>
        clamped >= r.minEvents &&
        (r.maxEvents === null || clamped <= r.maxEvents),
    ) ?? VOLUME_LADDER[0]
  );
}

/**
 * The per-event fee at a given commitment level, in pence. Rounds to whole
 * pence; a zero or negative base returns 0.
 */
export function ladderedFeePence(
  baseFeePence: number,
  eventCount: number,
): number {
  const base = Math.max(0, Math.round(baseFeePence || 0));
  if (base === 0) return 0;
  const rung = rungForEventCount(eventCount);
  return Math.round(base * (1 - rung.discount));
}

/** "5%" — whole-percent display for ladder tables. */
export function formatDiscount(discount: number): string {
  return `${Math.round(discount * 100)}%`;
}
