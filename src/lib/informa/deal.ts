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

import type { DealConfig, DealPreset } from "@/lib/deal-config";
import { productById } from "@/lib/informa/products";

/**
 * The slug credential for the live page. Minted once (matching the admin
 * action's format) and pinned here so the provisioning script and any
 * internal link share one value.
 */
export const INFORMA_PP_SLUG = "informa-portfolio-e1820d252a4f";

/** 10-second slots in one machine's between-plays ad loop. */
const SLOTS_PER_MACHINE = 6;

/**
 * One-click scenarios for the explorer, built shows-first: every preset is
 * a per-show recipe multiplied by a show count, so no count can imply a
 * floor plan that couldn't exist (one registration area per show, one
 * organizer booth per show, only a few premium common-area spots).
 *
 * The per-show recipe: 1 Registration Takeover, 1–2 Show-Floor Takeovers,
 * 2–3 In-Booth Machines, exactly 1 Rebooking Engine and 1 House Media
 * Unit. Ad slots assume a deliberately honest two-thirds sell-through of
 * the derived ceiling (6 per show-controlled machine), never a sell-out.
 * The first preset is the page's opening mix; every preset clears its
 * tier floor and the pilot minimum, and the totals land inside their
 * matching floor-ladder tier (12 → Pilot, 28 → Scale, 48 → Portfolio).
 */
const INFORMA_PRESETS: DealPreset[] = [
  {
    key: "pilot",
    label: "Pilot",
    description:
      "Two shows, six machines each: registration, one floor takeover, two in-booth machines, your rebooker and a media unit per show. 16 of 24 ad slots sold.",
    counts: {
      arrival: 2,
      floor: 2,
      booth: 4,
      rebooker: 2,
      "media-unit": 2,
      loop: 16,
    },
  },
  {
    key: "scale",
    label: "Scale",
    description:
      "Four shows, seven machines each once the pilot proves out — a second floor takeover joins per show. 32 of 48 ad slots sold.",
    counts: {
      arrival: 4,
      floor: 8,
      booth: 8,
      rebooker: 4,
      "media-unit": 4,
      loop: 32,
    },
  },
  {
    key: "portfolio",
    label: "Portfolio",
    description:
      "Six shows, eight machines each across the calendar — a third in-booth machine joins per show. 48 of 72 ad slots sold.",
    counts: {
      arrival: 6,
      floor: 12,
      booth: 18,
      rebooker: 6,
      "media-unit": 6,
      loop: 48,
    },
  },
];

/** A product's rate-card band as a lever band with the given price step. */
function bandFor(productId: string, step: number) {
  const { min, max, suggested } = productById(productId).retail;
  return { min, max, suggested, step };
}

/**
 * The rate-card products as deal levers, plus one deployment lever the
 * rate card doesn't carry: the house media unit.
 *
 * Money flows two ways and the config keeps them separate. Sponsor
 * products (Registration Takeover, Show-Floor Takeover, In-Booth Machine,
 * Screen Ad Network) are sponsorship revenue Informa sells, split 70/30. The
 * Rebooking Engine is the opposite direction: a flat service fee Informa
 * pays per show (`revenue: "service"`), never split — showing it inside
 * "gross sponsorship revenue" would tell Informa they retain 30% of their
 * own payment.
 *
 * Screen economics: a machine sold outright to one sponsor carries that
 * sponsor's brand alone — its screens are never sold as separate ad
 * inventory. Ad slots therefore only exist on machines Informa controls:
 * rebooking engines and house media units. The Screen Ad Network's
 * sellable-slot cap derives from those two levers live (`slotSource`), so
 * the calculator can never sell a slot with no screen to run it.
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
    {
      key: "arrival",
      label: productById("arrival").name,
      unitsPerItem: 1,
      note:
        "One per show — there is only one front door, which is why it commands the top of the rate card. A count of 4 means 4 shows. Screens carry that sponsor's brand alone.",
      retail: bandFor("arrival", 1_000),
    },
    {
      key: "floor",
      label: productById("floor").name,
      unitsPerItem: 1,
      note:
        "A sponsor machine in a premium common area you control — a main aisle, a lounge, the F&B queue. Realistically two or three of these spots exist per show; the scarcity is what the price buys. Screens carry the sponsor's brand alone.",
      retail: bandFor("floor", 1_000),
    },
    {
      key: "booth",
      label: productById("booth").name,
      unitsPerItem: 1,
      note:
        "Sold to exhibitors for their own stands — the volume product, since any booth big enough can take one. The exhibitor already owns the space; they buy the machine, the game and the lead flow. Screens carry the sponsor's brand alone.",
      retail: bandFor("booth", 1_000),
    },
    {
      key: "rebooker",
      label: productById("rebooker").name,
      unitsPerItem: 1,
      revenue: "service",
      note:
        "Exactly one per show, on your own booth — the count here doubles as the show count. A flat service fee you pay, not split revenue. Its screens are yours, so they host Screen Ad Network slots.",
      retail: bandFor("rebooker", 1_000),
    },
    {
      key: "media-unit",
      label: "House Media Unit",
      unitsPerItem: 1,
      note:
        "A show-branded machine you place in a high-footfall spot — one or two per show. It carries no line price of its own: it exists to host Screen Ad Network slots, and it counts toward the fleet and the floor ladder like any other machine.",
      retail: { min: 0, max: 0, suggested: 0, step: 500 },
    },
    {
      key: "loop",
      label: productById("loop").name,
      unitsPerItem: 0,
      slotSource: {
        slotsPerUnit: SLOTS_PER_MACHINE,
        sourceLevers: ["rebooker", "media-unit"],
      },
      note:
        "Six 10-second slots per show-controlled machine: rebooking engines and house media units. A machine sold to one sponsor carries that sponsor's brand alone, so its screens are never in this inventory.",
      retail: bandFor("loop", 500),
    },
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
  presets: INFORMA_PRESETS,
};

/** Hero copy for the private page. */
export const INFORMA_PP_HERO = {
  title: "The Bright.Blue line for the Informa portfolio",
  subtitle:
    "Five plain-named products your reps can sell straight off the rate card, running on one set of commercial rails. The numbers below are live: build the mix you would actually sell and watch what the program earns.",
  explorerNote:
    "Counts are portfolio-wide totals, and every scenario is built shows-first from a recipe a real floor plan can hold: one registration takeover and one rebooking machine per show, a couple of premium floor takeovers, in-booth machines as demand allows. The Rebooking Engine count doubles as the show count. Start from a scenario, then drag anything.",
  links: [
    { label: "Rate card & seller's kit", href: "/informa/kit" },
    { label: "Sample proof-of-performance report", href: "/informa/report" },
    { label: "Partnership deck", href: "/informa" },
  ],
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
