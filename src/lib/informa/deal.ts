/**
 * The Informa portfolio deal, expressed as a data-driven `DealConfig` for
 * the private partner-pricing page (`/pp/:slug`). Same commercial rails as
 * the NRS deal: 70/30 revenue share, take-or-pay pilot, per-unit floor
 * ladder. Levers map one-to-one onto the rate-card product family so the
 * private page and the seller's kit tell one coherent story.
 *
 * Buyer-safe by the deal-config contract: retail anchors, the split, floors
 * and commitment terms only. No internal economics.
 */

import type { DealConfig } from "@/lib/deal-config";
import { PRODUCT_FAMILY, productById } from "@/lib/informa/products";

/**
 * The slug credential for the live page. Minted once (matching the admin
 * action's format) and pinned here so the provisioning script and any
 * internal link share one value.
 */
export const INFORMA_PP_SLUG = "informa-portfolio-e1820d252a4f";

/** Lever price step: slots move in $500 steps, machines in $1,000. */
function stepFor(productId: string): number {
  return productId === "loop" ? 500 : 1_000;
}

/**
 * The four rate-card products as deal levers. The Loop deploys no machines
 * (`unitsPerItem: 0`): slots add revenue to the mix without moving the
 * floor-ladder unit count.
 */
export const INFORMA_DEAL_CONFIG: DealConfig = {
  currency: "USD",
  split: { brightBlue: 0.7, partner: 0.3 },
  commitment: {
    pilotMinUnits: 12,
    pilotMaxUnits: 15,
    maxUnits: 50,
    cutoffWeeks: 25,
  },
  levers: PRODUCT_FAMILY.map((p) => ({
    key: p.id,
    label: `${p.name} — ${p.descriptor}`,
    unitsPerItem: p.id === "loop" ? 0 : 1,
    retail: {
      min: p.retail.min,
      max: p.retail.max,
      suggested: p.retail.suggested,
      step: stepFor(p.id),
    },
  })),
  floorTiers: [
    { label: "Pilot", minUnits: 1, maxUnits: 15, floor: 15_000 },
    { label: "Scale", minUnits: 16, maxUnits: 30, floor: 13_500 },
    { label: "Portfolio", minUnits: 31, maxUnits: 50, floor: 12_000 },
  ],
};

/** Hero copy for the private page. */
export const INFORMA_PP_HERO = {
  title: "The Bright.Blue line for the Informa portfolio",
  subtitle:
    "Four named products your reps can sell straight off the rate card, running on one set of commercial rails. The numbers below are live: build the mix you would actually sell and watch what the program earns.",
} as const;

/** Row fields for provisioning the live page (script + migration mirror this). */
export const INFORMA_PP_PAGE = {
  slug: INFORMA_PP_SLUG,
  partnerName: "Informa",
  showLabel: "Portfolio program · starting Connect Marketplace, Tampa",
  template: "generic" as const,
  config: INFORMA_DEAL_CONFIG,
  hero: INFORMA_PP_HERO,
};

/** Convenience: the config lever for a given product id (throws on typos). */
export function leverForProduct(productId: string) {
  const lever = INFORMA_DEAL_CONFIG.levers.find((l) => l.key === productId);
  if (!lever) throw new Error(`No deal lever for product: ${productById(productId).id}`);
  return lever;
}
