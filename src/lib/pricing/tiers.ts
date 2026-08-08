/**
 * Canonical commercial tier vocabulary for Bright.Experience.
 *
 * Source of truth for the three-tier + bespoke pricing model defined in
 * `docs/20-pricing-and-packaging.md`. Every surface that shows tiered pricing
 * (the public pricing page, proposals, pitch links, the catalog) reads from
 * this file — an owner price change is a one-line edit here.
 *
 * Relationship to `src/lib/capabilities.ts`: the capability vocabulary is
 * unchanged. Tiers express *bundling* — which tailorable capabilities are
 * included at each level — via `includedCapabilitySlugs`, which must only
 * ever contain slugs from `CAPABILITIES`. The four always-on capabilities are
 * in every tier by definition and are not repeated here.
 *
 * ALL BANDS ARE PLACEHOLDERS pending owner sign-off (see OWNER-TODO.md
 * "Pricing & packaging"). They are evidence-backed — the trail is docs/20 §1.
 */

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

/** Regions we publish prices for. Anything else (e.g. Middle East) is POA. */
export type PriceRegion = "uk" | "us" | "eu";

export type TierSlug = "showstopper" | "lead-engine" | "command" | "bespoke";

export interface RegionBand {
  currency: "GBP" | "USD" | "EUR";
  /** Lower bound in minor units (pence / cents). */
  lowMinor: number;
  /** Upper bound in minor units. `null` means an open "From X" band (bespoke). */
  highMinor: number | null;
}

export interface PricingTier {
  slug: TierSlug;
  /** Display name — owner may rename without touching the slug. */
  displayName: string;
  /** The buyer's self-selection line — shown under the tier name. */
  strapline: string;
  badge: "most-popular" | null;
  /**
   * Tailorable capability slugs (from `capabilities.ts`) bundled into this
   * tier. Always-on capabilities are implicit in every tier.
   */
  includedCapabilitySlugs: ReadonlyArray<string>;
  /**
   * Human-service inclusions that are not machine capabilities (hosts,
   * producers, content capture). Copy shown verbatim on tier cards.
   */
  serviceFeatures: ReadonlyArray<string>;
  /** One line describing the reporting deliverable at this tier. */
  reporting: string;
  /**
   * Ladder framing shown on the card ("pilot here, step up next time").
   * Only the entry tier carries one today.
   */
  ladderNote?: string;
  /** Published 1–3 day activation bands per region. */
  bands: Record<PriceRegion, RegionBand>;
}

/* ----------------------------------------------------------------------------
 * The tiers — canonical order is ascending (Good → Better → Best → Bespoke)
 * ------------------------------------------------------------------------- */

export const TIERS: ReadonlyArray<PricingTier> = [
  {
    slug: "showstopper",
    displayName: "Showstopper",
    strapline: "Stop the crowd. Own the room.",
    badge: null,
    includedCapabilitySlugs: [],
    serviceFeatures: [],
    reporting: "Post-event summary — plays, dwell, peak hours",
    ladderNote:
      "The pilot rung — most brands prove the format here at one event, then step up to Lead Engine with the first summary in hand.",
    bands: {
      uk: { currency: "GBP", lowMinor: 950_000, highMinor: 1_350_000 },
      us: { currency: "USD", lowMinor: 1_800_000, highMinor: 2_800_000 },
      eu: { currency: "EUR", lowMinor: 1_100_000, highMinor: 1_550_000 },
    },
  },
  {
    slug: "lead-engine",
    displayName: "Lead Engine",
    strapline: "Prove it to the board.",
    badge: "most-popular",
    includedCapabilitySlugs: ["lead-capture"],
    serviceFeatures: ["Trained host on the stand"],
    reporting: "24-hour board-ready proof-of-performance report",
    bands: {
      uk: { currency: "GBP", lowMinor: 1_600_000, highMinor: 2_400_000 },
      us: { currency: "USD", lowMinor: 3_200_000, highMinor: 4_800_000 },
      eu: { currency: "EUR", lowMinor: 1_800_000, highMinor: 2_700_000 },
    },
  },
  {
    slug: "command",
    displayName: "Command",
    strapline: "A strategic program, run live.",
    badge: null,
    // Live telemetry is the deliberate Best-tier fence — rationale docs/20 §2.
    includedCapabilitySlugs: ["lead-capture", "live-telemetry"],
    serviceFeatures: [
      "Dedicated producer",
      "Content capture (photo + video)",
      "CRM sync — HubSpot, Salesforce, Klaviyo",
    ],
    reporting: "24-hour report with benchmark context vs the fleet",
    bands: {
      uk: { currency: "GBP", lowMinor: 2_800_000, highMinor: 4_200_000 },
      us: { currency: "USD", lowMinor: 5_500_000, highMinor: 8_500_000 },
      eu: { currency: "EUR", lowMinor: 3_150_000, highMinor: 4_750_000 },
    },
  },
  {
    slug: "bespoke",
    displayName: "Bespoke",
    strapline: "Tours, custom game builds, venue residencies.",
    badge: null,
    includedCapabilitySlugs: ["lead-capture", "live-telemetry"],
    serviceFeatures: [
      "Dedicated producer",
      "Content capture (photo + video)",
      "Custom game development",
      "Multi-city or multi-week programs",
    ],
    reporting: "Custom reporting cadence, agreed per program",
    bands: {
      uk: { currency: "GBP", lowMinor: 5_000_000, highMinor: null },
      us: { currency: "USD", lowMinor: 9_000_000, highMinor: null },
      eu: { currency: "EUR", lowMinor: 5_750_000, highMinor: null },
    },
  },
] as const;

/**
 * Presentation order for pricing surfaces: Best first (INSEAD order-effect
 * research — leading with Best raises the reference point), Bespoke as the
 * closing door. Canonical `TIERS` order stays ascending for ladder logic.
 */
export const TIER_DISPLAY_ORDER: ReadonlyArray<TierSlug> = [
  "command",
  "lead-engine",
  "showstopper",
  "bespoke",
];

/** All tier slugs, for boundary validation (URL params, DB values). */
export const TIER_SLUGS: ReadonlySet<string> = new Set(TIERS.map((t) => t.slug));

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Look up a tier by slug. Returns null for unknown slugs. */
export function getTier(slug: string): PricingTier | null {
  return TIERS.find((t) => t.slug === slug) ?? null;
}

/** Tiers in presentation order (Best → Good → Bespoke) for pricing surfaces. */
export function tiersForDisplay(): PricingTier[] {
  return TIER_DISPLAY_ORDER.map((slug) => getTier(slug)).filter(
    (t): t is PricingTier => t !== null,
  );
}

/** True when `slug` is a valid tier slug. Use on untrusted boundaries. */
export function isTierSlug(slug: unknown): slug is TierSlug {
  return typeof slug === "string" && TIER_SLUGS.has(slug);
}

/**
 * Data-dependent add-ons need the lead-capture layer, so they are only
 * offerable on tiers that include it. Everything else is offerable anywhere.
 */
const REQUIRES_LEAD_CAPTURE: ReadonlySet<string> = new Set([
  "survey-layer",
  "linkedin-follow",
  "branded-landing-page",
]);

/**
 * True when `capabilitySlug` may be sold as an à-la-carte add-on on `tier`.
 * Capabilities already included in the tier are not add-ons (returns false).
 */
export function isAddOnEligible(tier: PricingTier, capabilitySlug: string): boolean {
  if (tier.includedCapabilitySlugs.includes(capabilitySlug)) return false;
  if (REQUIRES_LEAD_CAPTURE.has(capabilitySlug)) {
    return tier.includedCapabilitySlugs.includes("lead-capture");
  }
  return true;
}

const CURRENCY_SYMBOL: Record<RegionBand["currency"], string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

/** "£9,500" — whole major units only; tier bands never carry pennies. */
export function formatBandAmount(currency: RegionBand["currency"], minor: number): string {
  const major = Math.round(minor / 100);
  return `${CURRENCY_SYMBOL[currency]}${major.toLocaleString("en-GB")}`;
}

/**
 * Format a tier's band for a region: "£9,500–£13,500", or "From £50,000"
 * for open-ended bespoke bands.
 */
export function formatTierBand(tier: PricingTier, region: PriceRegion): string {
  const band = tier.bands[region];
  const low = formatBandAmount(band.currency, band.lowMinor);
  if (band.highMinor === null) return `From ${low}`;
  return `${low}–${formatBandAmount(band.currency, band.highMinor)}`;
}
