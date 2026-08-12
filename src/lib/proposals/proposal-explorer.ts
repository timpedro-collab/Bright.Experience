/**
 * Pure maths for the proposal deal explorer — the post-reveal widget that
 * lets a customer toggle tailorable capabilities onto their quoted package
 * and watch the investment respond.
 *
 * Deliberately narrow in v1: the only lever is capability add-ons priced at
 * their catalogue `defaultPricePence`. Days and machine-count levers are out
 * of scope until a priced rule for them exists (owner decision — see
 * OWNER-TODO.md). The base fee is the quote's `total_amount` and is never
 * recomputed here; the explorer only ever adds to it.
 */

import { CAPABILITIES, sanitiseCapabilitySlugs, type Capability } from "@/lib/capabilities";

/** One toggleable add-on as the explorer presents it. */
export interface ExplorerOption {
  slug: string;
  /** Customer-facing line — capabilities are always shown by outcome, never slug. */
  outcome: string;
  /** Quiet caption under the outcome line. */
  mechanism: string;
  /** Price added to the investment when toggled on, in pence. */
  pricePence: number;
}

/** The live investment breakdown for a given toggle state. */
export interface ExplorerTotals {
  /** The quoted package fee, unchanged by the explorer. */
  baseFeePence: number;
  /** Sum of the toggled add-ons. */
  addonsPence: number;
  /** baseFeePence + addonsPence. */
  totalPence: number;
  /** The toggled options, in catalogue order, for line-by-line display. */
  toggled: ExplorerOption[];
}

function toOption(capability: Capability): ExplorerOption {
  return {
    slug: capability.slug,
    outcome: capability.outcome,
    mechanism: capability.mechanism,
    pricePence: capability.defaultPricePence,
  };
}

/**
 * The add-ons a quote's explorer can offer: every tailorable capability the
 * customer hasn't already got in their package, in catalogue order.
 */
export function explorerOptionsForQuote(
  selectedAddonSlugs: ReadonlyArray<string>,
): ExplorerOption[] {
  const selected = new Set(sanitiseCapabilitySlugs([...selectedAddonSlugs]));
  return CAPABILITIES.filter((c) => !selected.has(c.slug)).map(toOption);
}

/**
 * Compute the live investment for a toggle state. Toggled slugs are
 * sanitised against the canonical catalogue and de-duplicated; anything
 * already included in the package is ignored so a stale client can never
 * double-charge an add-on.
 */
export function computeExplorerTotals(
  baseFeePence: number,
  selectedAddonSlugs: ReadonlyArray<string>,
  toggledSlugs: ReadonlyArray<string>,
): ExplorerTotals {
  const base = Math.max(0, Math.round(baseFeePence || 0));
  const selected = new Set(sanitiseCapabilitySlugs([...selectedAddonSlugs]));
  const toggledClean = sanitiseCapabilitySlugs([...toggledSlugs]).filter(
    (slug) => !selected.has(slug),
  );
  const toggledSet = new Set(toggledClean);

  const toggled = CAPABILITIES.filter((c) => toggledSet.has(c.slug)).map(toOption);
  const addonsPence = toggled.reduce((sum, option) => sum + option.pricePence, 0);

  return {
    baseFeePence: base,
    addonsPence,
    totalPence: base + addonsPence,
    toggled,
  };
}
