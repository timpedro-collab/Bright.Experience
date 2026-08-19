/**
 * The Bright.Blue product family for organizer rate cards — four named,
 * repeatable products a sponsorship rep can read straight off the page.
 *
 * Two-part naming on purpose: a short brand name for decks ("The Arrival")
 * and a plain descriptor for the rate card ("Registration Takeover"), so a
 * line item explains itself in a sponsorship order.
 *
 * Buyer-safe like the rest of `src/lib/informa`: suggested retail bands
 * only. Splits, floors and internal economics live in the private
 * partner-pricing deal page, never here.
 */

import { formatUsdWhole } from "@/lib/informa/kit-math";

export interface InformaProduct {
  id: string;
  /** Short brand name for decks and tiles. */
  name: string;
  /** Plain rate-card descriptor: what the line item is. */
  descriptor: string;
  /** The one-line sell. */
  tagline: string;
  /** What is in the box. */
  includes: string[];
  /** Where it belongs on the floor. */
  placement: string;
  /** What the 24 hour report measures for it. */
  measures: string[];
  /** Suggested retail band. `unit` states what the band prices. */
  retail: { min: number; max: number; suggested: number; unit: string };
  /** Who signs the order. */
  buyer: "Sponsor" | "Organizer" | "Advertisers";
  /**
   * Preset for the placement configurator's price lever, for products the
   * configurator's per-machine lead math applies to. Omitted for The
   * Rebooker (organizer service, not sponsor lead-gen) and The Loop
   * (priced per slot, not per machine).
   */
  configuratorPrice?: number;
}

/** The four-product rate-card family, flagship first. */
export const PRODUCT_FAMILY: InformaProduct[] = [
  {
    id: "arrival",
    name: "The Arrival",
    descriptor: "Registration Takeover",
    tagline: "Own the first minutes of every attendee's show.",
    placement:
      "Registration, the entrance hall, or the main doors: the one spot the entire audience passes.",
    includes: [
      "Machine fully wrapped in the sponsor's brand",
      "Custom branded game, built and loaded by Bright.Blue",
      "Badge-gated plays with opted-in lead capture",
      "Prize or sample dispensing on wins",
      "Board-ready proof-of-performance report within 24 hours of close",
    ],
    measures: [
      "Plays and opted-in leads across the full attendee population",
      "Engagement by hour from the moment doors open",
      "Cost per opted-in lead against the industry benchmark",
    ],
    retail: { min: 50_000, max: 75_000, suggested: 60_000, unit: "per show" },
    buyer: "Sponsor",
    configuratorPrice: 60_000,
  },
  {
    id: "draw",
    name: "The Draw",
    descriptor: "Floor & Lounge Activation",
    tagline: "The busiest square meter on the show floor, wearing your brand.",
    placement:
      "A lounge, a main aisle, or inside the sponsor's own stand.",
    includes: [
      "Machine fully wrapped in the sponsor's brand",
      "Custom branded game, built and loaded by Bright.Blue",
      "Sampling on wins: configured to dispense almost anything that fits, from drinks and snacks to beauty and merch",
      "Badge-gated plays with opted-in lead capture",
      "Board-ready proof-of-performance report within 24 hours of close",
    ],
    measures: [
      "Plays, opted-in leads and dwell",
      "Cost per opted-in lead against the industry benchmark",
      "Sample and prize fulfilment, reconciled to stock",
    ],
    retail: { min: 30_000, max: 60_000, suggested: 40_000, unit: "per show" },
    buyer: "Sponsor",
    configuratorPrice: 40_000,
  },
  {
    id: "rebooker",
    name: "The Rebooker",
    descriptor: "Organizer Rebooking Engine",
    tagline: "Attendees play to unlock next year. Your rebooking number moves at the show.",
    placement: "The organizer's own stand or the rebooking desk.",
    includes: [
      "Machine wrapped in the show's own brand",
      "Play-to-unlock mechanics built around next year's booking",
      "Badge-gated eligibility that never resets on rescan",
      "Prize fulfilment controls for one-shot and retry-to-win games",
      "Participation report within 24 hours of close",
    ],
    measures: [
      "Plays, repeat visits and participation across the audience",
      "Prize fulfilment, reconciled to stock",
      "Engagement by hour at the rebooking desk",
    ],
    retail: {
      min: 35_000,
      max: 50_000,
      suggested: 40_000,
      unit: "per show, flat service fee",
    },
    buyer: "Organizer",
  },
  {
    id: "loop",
    name: "The Loop",
    descriptor: "Screen Ad Network",
    tagline: "The screens between plays are inventory. Sell them once, or six times.",
    placement:
      "Every deployed machine at the show; sold per slot or bundled across the fleet.",
    includes: [
      "A rolling loop of six 10 second ad slots between plays",
      "Run sole-sponsor or split and sold as separate inventory",
      "Up to three screens depending on the machine",
      "Every content play logged, so impressions are counted, not estimated",
    ],
    measures: [
      "Content plays and impressions per creative",
      "Delivery by day and hour, per machine",
    ],
    retail: { min: 3_000, max: 8_000, suggested: 5_000, unit: "per slot, per show" },
    buyer: "Advertisers",
  },
];

/** "$50,000 to $75,000 per show" — the rate-card band line. */
export function formatRetailBand(product: InformaProduct): string {
  const { min, max, unit } = product.retail;
  return `${formatUsdWhole(min)} to ${formatUsdWhole(max)} ${unit}`;
}

/** Product lookup by id; throws on unknown ids so typos fail loudly in dev. */
export function productById(id: string): InformaProduct {
  const product = PRODUCT_FAMILY.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown Informa product id: ${id}`);
  return product;
}
