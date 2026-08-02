/**
 * Canonical client-logo list for public marketing surfaces.
 *
 * One source of truth shared by the landing page, catalog `LogosStrip`, and
 * any other "trusted by" treatment so the wall of brands stays consistent and
 * is easy to audit. Drop real SVG/PNG assets into `/public/logos/*` and set
 * `src` to upgrade from the monogram fallback — a deferred handoff item.
 */
export interface ClientLogo {
  name: string;
  /** Optional logo asset. Falls back to a monogram when absent. */
  src?: string;
  /**
   * Optional max-height override. Stacked logos (e.g. Pelion) read better a
   * touch taller than the wordmark default.
   */
  imgClassName?: string;
  /**
   * The client's primary brand colour, injected inline into the case-study
   * tile hover wash (On Board pattern: per-client accent as data, not CSS —
   * twelve tiles, twelve colours, one component). Approximate hues, purely
   * decorative; swap for exact values if a brand team supplies them.
   * Absent → the tile falls back to Bright.Blue cobalt.
   */
  brandColor?: string;
}

/**
 * Brands Bright.Blue has run activations for — mirrors the "Trusted by leading
 * brands" wall on bright.blue/events. Storyblok and Adyen also appear as named
 * testimonials (see `src/lib/marketing/claims.ts`). Drop SVG/PNG assets into
 * `/public/logos/*` and set `src` to upgrade from the monogram fallback.
 */
/**
 * Every logo renders as a uniform white silhouette on the dark panel (see
 * `LogosStrip`) via `brightness-0 invert`. All assets are transparent PNG/SVG
 * (the Pelion and Intact marks have had their opaque white backgrounds stripped
 * so they normalise like the rest). Stacked marks can opt into a taller height.
 */
export const CLIENT_LOGOS: ClientLogo[] = [
  { name: "Storyblok", src: "/logos/storyblok.svg", brandColor: "#09b3af" },
  { name: "Adyen", src: "/logos/adyen.svg", brandColor: "#0abf53" },
  { name: "Red Bull", src: "/logos/red-bull.svg", brandColor: "#db0a40" },
  { name: "Pepsi", src: "/logos/pepsi.png", brandColor: "#005cb4" },
  { name: "Porsche", src: "/logos/porsche.svg", brandColor: "#d5001c" },
  { name: "Suntory", src: "/logos/suntory.svg", brandColor: "#004098" },
  { name: "Lucozade", src: "/logos/lucozade.png", brandColor: "#ff8200" },
  { name: "Celsius", src: "/logos/celsius.svg", brandColor: "#f47920" },
  { name: "Pelion", src: "/logos/pelion.png", brandColor: "#00a19a" },
  { name: "Intact", src: "/logos/intact.png", brandColor: "#c8102e" },
  // British Insurance Brokers' Association — real BIBA Conference client. Full
  // lion + wordmark lockup; supplied asset had its white background stripped to
  // a transparent mask so it normalises to white like the rest of the wall.
  {
    name: "British Insurance Brokers' Association",
    src: "/logos/biba.png",
    brandColor: "#003087",
  },
];

/** Case-study `client_name` values that differ from the logo's display name. */
const CLIENT_NAME_ALIASES: Record<string, string> = {
  BIBA: "British Insurance Brokers' Association",
};

/**
 * Resolve a client's logo asset by name (case-study `client_name`), so
 * photo-less case studies can fall back to a deliberate branded tile instead
 * of a placeholder monogram. Returns undefined when we hold no logo.
 */
export function logoForClient(clientName?: string): ClientLogo | undefined {
  if (!clientName) return undefined;
  const canonical = CLIENT_NAME_ALIASES[clientName] ?? clientName;
  return CLIENT_LOGOS.find(
    (logo) => logo.name.toLowerCase() === canonical.toLowerCase()
  );
}
