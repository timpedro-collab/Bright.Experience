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

/** 10-second slots in one machine's between-plays ad loop. */
const SLOTS_PER_MACHINE = 6;

/**
 * The rate-card products as deal levers, plus one deployment lever the
 * rate card doesn't carry: the show-placed media unit.
 *
 * Screen economics: a machine sold outright to one sponsor (The Arrival,
 * The Draw) carries that sponsor's brand alone — its screens are never
 * sold as separate ad inventory. Loop slots therefore only exist on
 * machines Informa controls: the rebooking engine on Informa's own booth
 * and show-branded media units Informa places in premium footfall spots.
 * The Loop's sellable-slot cap derives from those two levers live
 * (`slotSource`), so the calculator can never sell a slot with no screen
 * to run it.
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
  levers: [
    ...PRODUCT_FAMILY.filter((p) => p.id !== "loop").map((p) => ({
      key: p.id,
      label: `${p.name} — ${p.descriptor}`,
      unitsPerItem: 1,
      retail: {
        min: p.retail.min,
        max: p.retail.max,
        suggested: p.retail.suggested,
        step: stepFor(p.id),
      },
    })),
    {
      key: "media-unit",
      label: "Show-placed media unit — Informa-controlled, premium footfall",
      unitsPerItem: 1,
      note:
        "A show-branded machine Informa places in a high-footfall spot. It carries no line price of its own: it exists to host Loop ad slots, and it counts toward the fleet and the floor ladder like any other machine.",
      retail: { min: 0, max: 0, suggested: 0, step: 500 },
    },
    (() => {
      const loop = productById("loop");
      return {
        key: loop.id,
        label: `${loop.name} — ${loop.descriptor}`,
        unitsPerItem: 0,
        slotSource: {
          slotsPerUnit: SLOTS_PER_MACHINE,
          sourceLevers: ["rebooker", "media-unit"],
        },
        note:
          "Six 10-second slots per Informa-controlled machine: the rebooking engine and show-placed media units. A machine sold to one sponsor carries that sponsor's brand alone, so its screens are never in this inventory.",
        retail: {
          min: loop.retail.min,
          max: loop.retail.max,
          suggested: loop.retail.suggested,
          step: stepFor(loop.id),
        },
      };
    })(),
  ],
  // Floors assume the organizer carries in-building venue services
  // (drayage, positioning, electrical, union labor where required) on
  // their general-service master contract at organizer rates, as in the
  // NRS deal. If Bright.Blue had to buy that labor at outside-exhibitor
  // rates these floors would rise substantially.
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
