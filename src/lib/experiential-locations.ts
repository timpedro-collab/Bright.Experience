/**
 * Curated, real-world out-of-home (OOH) activation sites for the experiential
 * quiz track. Footfall figures are grounded in published sources so the
 * projected-reach and DOOH media-value numbers hold up in a sales conversation.
 *
 * London Waterloo is the hero site:
 *   - 70.4M passenger entries + exits in 2024–25 — Great Britain's 2nd busiest
 *     station (Office of Rail and Road, station usage 2024–25).
 *   - JCDecaux's Waterloo channel cites ~2.2M footfall/week delivering ~40M
 *     weekly viewed impressions across its screen estate.
 * We model a single brand activation conservatively off daily footfall and a
 * pass-rate, then multiply impressions across the frozen unit's three screens.
 *
 * Pure module (no I/O) so it is safe to import from the client-side quiz.
 */
import {
  experientialReach,
  type ExperientialReachInput,
  type ReachResult,
} from "./reach";

export type LocationTierLevel = "tier_1" | "tier_2" | "tier_3" | "tier_4";

export interface ExperientialLocation {
  /** Stable key used in the quiz state + proposal querystring. */
  key: string;
  /** Full display name. */
  name: string;
  /** Short label for compact chips. */
  shortName: string;
  region: string;
  tier: LocationTierLevel;
  /** Real (or realistically estimated) daily footfall at the site. */
  dailyFootfall: number;
  /** Share of footfall that passes within sight of a concourse unit (0–1). */
  passRate: number;
  /** Open-market OOH CPM for the site, in whole USD dollars per 1,000. */
  cpm: number;
  /** One-line positioning for the location card. */
  blurb: string;
  /** Internal credibility note / source for the footfall figure. */
  source: string;
  /** The hero site shown first and used in the Magnum demo. */
  hero?: boolean;
  /** A partner-network space (vs. a single named site) — shown with a partner badge. */
  partner?: boolean;
}

export const EXPERIENTIAL_LOCATIONS: ExperientialLocation[] = [
  {
    key: "london-waterloo",
    name: "London Waterloo Station",
    shortName: "Waterloo",
    region: "London",
    tier: "tier_1",
    dailyFootfall: 195_000,
    passRate: 0.4,
    cpm: 13,
    blurb:
      "Great Britain's 2nd-busiest station — 70.4M passengers a year through one concourse of affluent commuters.",
    source: "ORR station usage 2024–25 (70.4M entries+exits); JCDecaux Motion@Waterloo.",
    hero: true,
  },
  {
    key: "westfield-london",
    name: "Westfield London, Shepherd's Bush",
    shortName: "Westfield London",
    region: "London",
    tier: "tier_1",
    dailyFootfall: 85_000,
    passRate: 0.35,
    cpm: 11,
    blurb: "Europe's largest shopping centre — a dwelling, high-intent retail crowd.",
    source: "Unibail-Rodamco-Westfield reported ~28–30M visitors/year.",
  },
  {
    key: "manchester-piccadilly",
    name: "Manchester Piccadilly Station",
    shortName: "Manchester Piccadilly",
    region: "North West",
    tier: "tier_2",
    dailyFootfall: 68_000,
    passRate: 0.38,
    cpm: 9,
    blurb: "The North West's primary rail gateway — strong commuter + leisure mix.",
    source: "ORR station usage — ~25M entries+exits/year.",
  },
  {
    key: "birmingham-newstreet",
    name: "Birmingham New Street & Bullring",
    shortName: "Birmingham",
    region: "West Midlands",
    tier: "tier_2",
    dailyFootfall: 90_000,
    passRate: 0.34,
    cpm: 9,
    blurb: "The busiest interchange outside London, feeding straight into the Bullring.",
    source: "ORR station usage — Birmingham New Street ~47M entries+exits/year.",
  },
  // ---- Partner networks ---------------------------------------------------
  // Promotional space booked through our managed partners. Footfall shown is a
  // representative single-site figure; the exact site + numbers are confirmed
  // with the partner on the walkthrough.
  {
    key: "space-and-people",
    name: "Space & People — UK shopping-centre network",
    shortName: "Space & People",
    region: "UK & Ireland network",
    tier: "tier_2",
    dailyFootfall: 55_000,
    passRate: 0.32,
    cpm: 8,
    blurb: "Promotional pitches across 100+ UK & Ireland shopping centres — dwelling, high-intent shoppers.",
    source: "Space & People managed retail-mall network; representative per-centre daily footfall.",
    partner: true,
  },
  {
    key: "simon-malls",
    name: "Simon Property — premium US malls",
    shortName: "Simon Malls",
    region: "US network",
    tier: "tier_1",
    dailyFootfall: 50_000,
    passRate: 0.34,
    cpm: 12,
    blurb: "Flagship US shopping destinations — high-dwell, high-spend retail crowds.",
    source: "Simon Property Group flagship-mall network; representative per-mall daily footfall.",
    partner: true,
  },
];

/** A generic fallback for the quiz's "Somewhere else" option. */
export const FALLBACK_EXPERIENTIAL_LOCATION: ExperientialLocation = {
  key: "other",
  name: "Another high-footfall location",
  shortName: "Your location",
  region: "UK",
  tier: "tier_3",
  dailyFootfall: 35_000,
  passRate: 0.3,
  cpm: 7,
  blurb: "Tell us where — we'll model the reach off the site's real footfall.",
  source: "Conservative tier-3 high-street estimate; refined from the postcode on the call.",
};

const BY_KEY: Record<string, ExperientialLocation> = Object.fromEntries(
  [...EXPERIENTIAL_LOCATIONS, FALLBACK_EXPERIENTIAL_LOCATION].map((l) => [l.key, l]),
);

/** Look up a curated location by key, falling back to the generic estimate. */
export function getExperientialLocation(key: string | null | undefined): ExperientialLocation {
  if (key && BY_KEY[key]) return BY_KEY[key];
  return FALLBACK_EXPERIENTIAL_LOCATION;
}

/** Compute projected reach for a location over a number of days on site. */
export function reachForLocation(
  location: ExperientialLocation,
  days: number,
  overrides?: Partial<ExperientialReachInput>,
): ReachResult {
  return experientialReach({
    dailyFootfall: location.dailyFootfall,
    passRate: location.passRate,
    cpm: location.cpm,
    days,
    ...overrides,
  });
}

export const TIER_LABEL: Record<LocationTierLevel, string> = {
  tier_1: "Tier 1 · Premium",
  tier_2: "Tier 2 · Major",
  tier_3: "Tier 3 · Regional",
  tier_4: "Tier 4 · Local",
};

/** 1–4 "heat" level for footfall visualisation on the location cards. */
export const TIER_HEAT: Record<LocationTierLevel, number> = {
  tier_1: 4,
  tier_2: 3,
  tier_3: 2,
  tier_4: 1,
};
