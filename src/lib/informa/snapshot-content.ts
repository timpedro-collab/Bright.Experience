/**
 * Bright.Blue × Informa — content for the 5-slide snapshot deck
 * (`/informa/snapshot`): the forwardable, minimal-text companion to the
 * full partnership deck at `/informa`.
 *
 * Copy rules follow `@/lib/informa/content`: US English, no em dashes in
 * buyer-facing strings, projections labelled illustrative. Every number
 * derives from `products.ts` and `deal.ts` so the snapshot can never
 * drift from the rate card or the private calculator.
 */

import {
  computeConfigDeal,
  type DealConfigInputs,
} from "@/lib/deal-config";
import { INFORMA_DEAL_CONFIG } from "@/lib/informa/deal";
import { formatRetailBand, PRODUCT_FAMILY } from "@/lib/informa/products";

/** Slide 1: the cover. */
export const SNAPSHOT_COVER = {
  headlineLead: "New inventory for the shows",
  headlineAccent: "you already run.",
  sub: "The whole story in five slides.",
  cta: "See it in five",
} as const;

/**
 * Slide 2: what this is, in four statements. Icons are chosen by `id` in
 * the slide component so this module stays pure data.
 */
export const SNAPSHOT_WHAT = {
  overline: "What this is",
  headline: "Sponsor-funded machines. Measured to the play.",
  points: [
    {
      id: "machines",
      title: "Sponsor-branded machines",
      line: "Full-size interactive game machines, wrapped edge to edge, on your show floor.",
    },
    {
      id: "badge",
      title: "Badge scan to play",
      line: "Every play starts with a real registrant and an opt-in.",
    },
    {
      id: "report",
      title: "Proof in 24 hours",
      line: "A board-ready proof-of-performance report within 24 hours of close.",
    },
    {
      id: "delivery",
      title: "We deliver. You sell.",
      line: "Build, wrap, freight, install, ops and teardown are all Bright.Blue's.",
    },
  ],
} as const;

/**
 * Slide 3: the proof collage. Real activation photography from
 * `public/pitch/photos/`; captions read brand first, context second.
 */
export const SNAPSHOT_COLLAGE = {
  overline: "The proof",
  headline: "Live brands. Live floors.",
  photos: [
    {
      src: "/pitch/photos/pepsi-midplay-crowd.jpg",
      alt: "Attendee mid-play on a wrapped Pepsi machine while another films on his phone",
      caption: "Pepsi · live activation",
    },
    {
      src: "/pitch/photos/adyen-play-queue.jpg",
      alt: "Queue of attendees waiting to play a wrapped Adyen machine",
      caption: "Adyen · the queue is the point",
    },
    {
      src: "/pitch/photos/pelion-expo-play.jpg",
      alt: "Attendee playing a fully wrapped machine on a live trade show floor",
      caption: "Pelion · expo floor",
    },
    {
      src: "/pitch/photos/absolut-qr-scan.jpg",
      alt: "Attendee scanning the on-screen QR code with his phone on a bottle-locker machine",
      caption: "Absolut · scan to play",
    },
    {
      src: "/pitch/photos/madfest-stand-crowd.jpg",
      alt: "Crowd gathered around a branded machine at a festival stand",
      caption: "MADFEST · stand crowd",
    },
    {
      src: "/pitch/photos/biba-leadenhall.jpg",
      alt: "Branded play-to-win machine drawing a queue at a conference activation",
      caption: "BIBA · conference foyer",
    },
  ],
} as const;

/** One rate-card tile on the packages slide. */
export interface SnapshotPackage {
  id: string;
  name: string;
  /** One-breath subtitle from the rate card. */
  descriptor: string;
  /** "$45,000 to $60,000 per show" — the retail band line. */
  band: string;
  /** "$45–60k" — the band as display-size price typography. */
  bandCompact: string;
  /** "per show" — the small suffix under the compact band. */
  bandUnit: string;
}

/** "$45–60k" — a retail band compacted to price-tag typography. */
export function compactBand(min: number, max: number): string {
  return `$${Math.round(min / 1_000)}–${Math.round(max / 1_000)}k`;
}

/**
 * Slide 4: the five-product family as tiles, derived straight from the
 * rate card so names and bands can never fork from `/informa/kit`.
 */
export const SNAPSHOT_PACKAGES: SnapshotPackage[] = PRODUCT_FAMILY.map((p) => ({
  id: p.id,
  name: p.name,
  descriptor: p.descriptor,
  band: formatRetailBand(p),
  bandCompact: compactBand(p.retail.min, p.retail.max),
  bandUnit: p.retail.unit,
}));

export const SNAPSHOT_PACKAGES_COPY = {
  overline: "The package",
  headline: "Five products. One rate card.",
  footnote:
    "Suggested retail bands. Your team sets final pricing per show.",
} as const;

/**
 * The Screen Ad Network demonstration under the rate-card tiles: machine
 * front-face mockups showing exactly where a 10-second creative runs.
 * Assets live in public/pitch/machines/ (from the Bright.Blue pricing
 * design system; the screens are the generic ad-slot states, not the
 * retail UI, so they read correctly in an events context).
 */
export const SNAPSHOT_AD_DEMO = {
  title: "Where the 10-second slot runs",
  line: "Full screen, in the machine's idle rotation between plays, on the machines the show controls.",
  machines: [
    {
      src: "/pitch/machines/ad-slot-video.webp",
      alt: "Machine front face with a full-screen 10-second video ad slot on its display",
      caption: "Video · 10s",
    },
    {
      src: "/pitch/machines/ad-slot-image.webp",
      alt: "Machine front face with a full-screen 10-second static ad slot on its display",
      caption: "Static · 10s",
    },
  ],
} as const;

/** The worked Pilot example on slide 5, derived from the live deal config. */
export interface PilotSnapshot {
  /** Shows in the pilot recipe (the rebooker count, per the deal config). */
  shows: number;
  /** Machines on the floor across the pilot mix. */
  machines: number;
  /** Gross sponsorship revenue at suggested retail, whole USD. */
  gross: number;
  /** Informa's retained share of that gross, whole USD. */
  partnerShare: number;
  /** The partner share as a percentage string, e.g. "30%". */
  sharePercent: string;
}

/**
 * Compute the Pilot preset's headline economics from the same config the
 * private calculator runs on. Only the sell-side story is quoted here:
 * gross sponsorship revenue and the retained share. Organizer-paid
 * services (the Rebooking Engine's flat fee) are priced separately and
 * deliberately excluded from "what you make on sales".
 */
export function pilotSnapshot(): PilotSnapshot {
  const preset = INFORMA_DEAL_CONFIG.presets?.find((p) => p.key === "pilot");
  if (!preset) throw new Error("Informa deal config is missing the pilot preset");

  const inputs: DealConfigInputs = {};
  for (const lever of INFORMA_DEAL_CONFIG.levers) {
    inputs[lever.key] = {
      count: preset.counts[lever.key] ?? 0,
      retail: lever.retail.suggested,
    };
  }
  const summary = computeConfigDeal(INFORMA_DEAL_CONFIG, inputs);

  return {
    shows: preset.counts["rebooker"] ?? 0,
    machines: summary.totalUnits,
    gross: summary.gross,
    partnerShare: summary.partnerKeeps,
    sharePercent: `${Math.round(INFORMA_DEAL_CONFIG.split.partner * 100)}%`,
  };
}

/** Slide 5: what Informa makes, plus where to go deeper. */
export const SNAPSHOT_VALUE = {
  overline: "What you make",
  headline: "30% of every sale is yours to keep.",
  sub: "Bright.Blue builds, delivers and operates every placement. Your reps sell the line; the margin stays with the show.",
  footnote:
    "Illustrative at suggested retail. Organizer services like the Rebooking Engine are flat-fee and priced separately.",
  links: [
    { label: "Full partnership deck", href: "/informa" },
    { label: "Seller's kit & rate card", href: "/informa/kit" },
    { label: "Sample proof-of-performance report", href: "/informa/report" },
  ],
} as const;
