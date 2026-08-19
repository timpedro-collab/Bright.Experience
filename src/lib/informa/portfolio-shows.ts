/**
 * Curated Informa shows for the partnership deck's portfolio map slide.
 * Two tiers, on purpose: the labeled *target* cities are the US and UK
 * rooms the program is actually aimed at next (Tampa pilots, NRS Chicago
 * is the marquee target), while `reach` cities render as faint unlabeled
 * dots — they say "the rails travel worldwide" without diluting the
 * target list. Every entry is a publicly listed Informa brand — the map
 * claims nothing about the portfolio that Informa doesn't publish itself.
 *
 * Markers are positioned over `public/pitch/map/world-dots.svg` with
 * `projectToMapPercent`. MAP_BOUNDS here must stay identical to BOUNDS in
 * `scripts/generate-world-dots.mjs`, which generated that SVG — the test
 * next to this file checks the committed SVG's viewBox against them.
 */

/** Geographic crop of the committed dot map (equirectangular). */
export const MAP_BOUNDS = {
  west: -180,
  east: 180,
  south: -60,
  north: 75,
} as const;

/** One marker on the portfolio map: a host city and its marquee shows. */
export interface PortfolioCity {
  key: string;
  city: string;
  lat: number;
  lng: number;
  /** Marquee Informa shows hosted in this city. */
  shows: string[];
  /** The program's first deployment — rendered as the highlighted marker. */
  pilot?: boolean;
  /**
   * Wider-portfolio city, not on the target list: rendered as a faint
   * unlabeled dot and excluded from the chip row.
   */
  reach?: boolean;
}

export const PORTFOLIO_CITIES: PortfolioCity[] = [
  // The target list: pilot + the US and UK rooms the program walks into next.
  {
    key: "tampa",
    city: "Tampa",
    lat: 27.95,
    lng: -82.46,
    shows: ["Connect Marketplace"],
    pilot: true,
  },
  {
    key: "chicago",
    city: "Chicago",
    lat: 41.88,
    lng: -87.63,
    shows: ["National Restaurant Show"],
  },
  {
    key: "las-vegas",
    city: "Las Vegas",
    lat: 36.17,
    lng: -115.14,
    shows: ["World of Concrete", "MAGIC", "Black Hat"],
  },
  {
    key: "anaheim",
    city: "Anaheim",
    lat: 33.84,
    lng: -117.91,
    shows: ["Natural Products Expo West"],
  },
  {
    key: "detroit",
    city: "Detroit",
    lat: 42.33,
    lng: -83.05,
    shows: ["The Battery Show"],
  },
  {
    key: "london",
    city: "London",
    lat: 51.51,
    lng: -0.13,
    shows: ["London Tech Week", "Black Hat Europe"],
  },
  // The wider portfolio: faint dots that say the rails travel, nothing more.
  {
    key: "sao-paulo",
    city: "São Paulo",
    lat: -23.55,
    lng: -46.63,
    shows: ["Fispal Tecnologia"],
    reach: true,
  },
  {
    key: "monaco",
    city: "Monaco",
    lat: 43.74,
    lng: 7.43,
    shows: ["Monaco Yacht Show"],
    reach: true,
  },
  {
    key: "berlin",
    city: "Berlin",
    lat: 52.52,
    lng: 13.4,
    shows: ["SuperReturn International"],
    reach: true,
  },
  {
    key: "barcelona",
    city: "Barcelona",
    lat: 41.39,
    lng: 2.17,
    shows: ["Vitafoods Europe"],
    reach: true,
  },
  {
    key: "dubai",
    city: "Dubai",
    lat: 25.2,
    lng: 55.27,
    shows: ["Arab Health", "Middle East Energy"],
    reach: true,
  },
  {
    key: "riyadh",
    city: "Riyadh",
    lat: 24.71,
    lng: 46.68,
    shows: ["Cityscape Global"],
    reach: true,
  },
  {
    key: "bangkok",
    city: "Bangkok",
    lat: 13.76,
    lng: 100.5,
    shows: ["ProPak Asia"],
    reach: true,
  },
  {
    key: "hong-kong",
    city: "Hong Kong",
    lat: 22.32,
    lng: 114.17,
    shows: ["Jewellery & Gem WORLD"],
    reach: true,
  },
  {
    key: "shanghai",
    city: "Shanghai",
    lat: 31.23,
    lng: 121.47,
    shows: ["CPHI China"],
    reach: true,
  },
];

/**
 * Project a coordinate onto the dot map as CSS percentages
 * (equirectangular, matching how the SVG was rasterized), for absolutely
 * positioned markers inside a container that exactly wraps the map image.
 */
export function projectToMapPercent(
  lat: number,
  lng: number,
): { leftPct: number; topPct: number } {
  const { west, east, south, north } = MAP_BOUNDS;
  return {
    leftPct: ((lng - west) / (east - west)) * 100,
    topPct: ((north - lat) / (north - south)) * 100,
  };
}
