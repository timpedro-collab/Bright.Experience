/**
 * Canonical marketing claims for public surfaces — the single place where
 * headline numbers, testimonials, and commercial framing live.
 *
 * Sales-psychology rules encoded here:
 *  - The strongest consensus proof (rebook rate) always leads.
 *  - Every trust-band stat is a hard number; hygiene factors (GDPR) are
 *    captions, never hero tiles.
 *  - All figures are verified with the commercial team before changing.
 */

export interface MarketingStat {
  /** Hero number, e.g. "92%" or "200k". */
  value: string;
  /** Short label under / beside the number. */
  label: string;
}

export interface Testimonial {
  /** Quotation text without quote marks (renderers add them). */
  text: string;
  author: string;
  role: string;
  company: string;
  /** Client logo asset in /public/logos (rendered beside the quote). */
  logoSrc?: string;
}

/**
 * Hero stat pills, strongest first. The rebook rate is consensus proof
 * ("people who buy this buy it again") — it always takes position one.
 */
export const HERO_STATS: MarketingStat[] = [
  { value: "92%", label: "rebook rate" },
  { value: "Up to 40%", label: "more leads captured" },
  { value: "12", label: "markets live" },
];

/**
 * Trust-band tiles: three hard numbers, no adjectives. Tiles must be aggregate
 * portfolio numbers or process guarantees — never single-client-attributed
 * figures, which require that client's written publication approval (see
 * docs/18-design-research.md §4a). All figures are verified with the
 * commercial team before changing.
 */
export const TRUST_STATS: [MarketingStat, MarketingStat, MarketingStat] = [
  { value: "92%", label: "of clients rebook after their first activation" },
  { value: "Up to 40%", label: "more leads captured than a standard stand" },
  { value: "100%", label: "consent rate on captured leads" },
];

/** Hygiene-factor caption shown under the trust band, never as a hero tile. */
export const TRUST_CAPTION =
  "Every play runs through GDPR-compliant capture — clean, structured, first-party data.";

/** Full named testimonials, mirrored from bright.blue/events. */
export const TESTIMONIALS: Testimonial[] = [
  {
    text: "Bright.Blue brought our DMEXCO booth to life. The interactive swag machine became a magnet for attendees, giving us both a fun experience and high-quality data — automatically. Tim and the team were an absolute dream to work with: fast, responsive, supportive, and fully hands-on. This activation didn't just drive engagement — it elevated our whole presence at the event.",
    author: "Ioana Grapa",
    role: "Head of Global Events",
    company: "Storyblok",
    logoSrc: "/logos/storyblok.svg",
  },
  {
    text: "We vended gifts from their unattended machine and saw fantastic attendee engagement — one of the most popular activations! The ability to fully customise the machine meant it integrated perfectly with our event branding. The Bright.Blue team handled everything from delivery and setup to restocking throughout the evening, so I could focus on the event itself.",
    author: "Brigitte Brown",
    role: "Senior Event Marketing Manager",
    company: "Adyen",
    logoSrc: "/logos/adyen.svg",
  },
];

/**
 * Honest scarcity: machines are physical inventory and dates genuinely book
 * out. One line, used once, near the final CTA.
 */
export const SCARCITY_LINE =
  "Machines are physical inventory — popular event dates book out 6–8 weeks ahead.";

/** The quiz CTA payoff: what a visitor gets and what it costs them. */
export const QUIZ_CTA = {
  label: "Find your match",
  payoff: "60 seconds → the right machine and a reach estimate for your event.",
  href: "/quiz",
} as const;
