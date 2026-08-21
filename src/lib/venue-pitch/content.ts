/**
 * Bright.Blue for venues — content for the 5-slide venue snapshot deck
 * (`/venue`), aimed at convention centers and expo venues that host trade
 * shows.
 *
 * The pitch is deliberately non-financial: the venue's win is a better
 * building to sell (modern attendee experience, sponsor-funded energy,
 * zero cost and zero operations), with one light line noting machines can
 * join the venue's own sponsorship inventory. No splits, no internal
 * economics, no revenue promises.
 *
 * Copy rules follow `@/lib/informa/content`: US English, no em dashes in
 * buyer-facing strings.
 */

/** Slide 1: the cover. */
export const VENUE_COVER = {
  headlineLead: "Your floor,",
  headlineAccent: "working harder.",
  sub: "Sponsor-funded interactive machines for the shows your building hosts. Installed, operated and removed by Bright.Blue.",
  cta: "See how it works",
} as const;

/**
 * Slide 2: what this is, in four statements. Icons are chosen by `id` in
 * the slide component so this module stays pure data.
 */
export const VENUE_WHAT = {
  overline: "What this is",
  headline: "A turnkey attraction. Zero lift for the building.",
  points: [
    {
      id: "turnkey",
      title: "We install, operate, maintain",
      line: "Bright.Blue crews deliver, run and remove every machine around the show schedule.",
    },
    {
      id: "funded",
      title: "Sponsors fund every placement",
      line: "Brands pay for the machines. The building never buys anything.",
    },
    {
      id: "badge",
      title: "Attendees engage with a badge scan",
      line: "A fast branded game with real rewards, gated on a real registrant.",
    },
    {
      id: "zerocost",
      title: "Zero cost. Zero operations.",
      line: "No capital, no staffing, no work package for venue ops.",
    },
  ],
} as const;

/**
 * Slide 3: the proof collage. Same real activation photography as the
 * organizer decks, captioned for a venue audience.
 */
export const VENUE_COLLAGE = {
  overline: "The proof",
  headline: "Buildings where this already works.",
  photos: [
    {
      src: "/pitch/photos/biba-leadenhall.jpg",
      alt: "Branded play-to-win machine drawing a queue at a conference activation",
      caption: "Conference foyer · queue formed",
    },
    {
      src: "/pitch/photos/pelion-expo-play.jpg",
      alt: "Attendee playing a fully wrapped machine on a live trade show floor",
      caption: "Expo floor · live show",
    },
    {
      src: "/pitch/photos/pepsi-midplay-crowd.jpg",
      alt: "Attendee mid-play on a wrapped Pepsi machine while another films on his phone",
      caption: "Common area · crowd stopped",
    },
    {
      src: "/pitch/photos/adyen-play-queue.jpg",
      alt: "Queue of attendees waiting to play a wrapped Adyen machine",
      caption: "Sponsor activation · Adyen",
    },
    {
      src: "/pitch/photos/madfest-stand-crowd.jpg",
      alt: "Crowd gathered around a branded machine at a festival stand",
      caption: "Festival hall · MADFEST",
    },
    {
      src: "/pitch/photos/absolut-qr-scan.jpg",
      alt: "Attendee scanning the on-screen QR code with his phone on a bottle-locker machine",
      caption: "Scan to play · Absolut",
    },
  ],
} as const;

/**
 * Slide 4: what a placement needs — the venue-facing "package". Spec
 * tiles instead of price tiles, because the building never pays.
 */
export const VENUE_NEEDS = {
  overline: "The package",
  headline: "One square meter and a socket.",
  specs: [
    {
      id: "space",
      title: "Floor space",
      line: "About one square meter, plus queueing room in front.",
    },
    {
      id: "power",
      title: "Power",
      line: "One standard power socket. No network required.",
    },
    {
      id: "schedule",
      title: "Install and derig",
      line: "Around the show schedule, by Bright.Blue crews, coordinated with venue ops.",
    },
    {
      id: "cost",
      title: "Cost to the building",
      line: "Nothing. Every placement is sponsor-funded end to end.",
    },
  ],
  footnote:
    "Machines fit registration halls, foyers, lounges and main aisles. Indoors or under cover, wherever the audience already walks.",
} as const;

/**
 * Slide 5: how the venue benefits. Non-financial value first; one light
 * economics line at the end, no numbers.
 */
export const VENUE_BENEFITS = {
  overline: "Why the building wins",
  headline: "A better venue to book.",
  points: [
    {
      id: "differentiator",
      title: "A differentiator in the sales deck",
      line: "When organizers compare buildings, yours comes with a turnkey activation program already in place.",
    },
    {
      id: "energy",
      title: "Energy where the floor goes quiet",
      line: "Sponsor-funded attractions pull crowds into foyers, corridors and slow corners.",
    },
    {
      id: "experience",
      title: "A more modern attendee experience",
      line: "Interactive, rewarding moments attendees film and share, inside your walls.",
    },
    {
      id: "proof",
      title: "Proof the building performs",
      line: "Every placement is measured to the play. Engagement data that showcases your venue to the next organizer.",
    },
  ],
  economicsNote:
    "And when the venue sells its own sponsorships, machines can join that inventory too. Talk to us about how other buildings run it.",
  contact: {
    label: "Start the conversation",
    href: "mailto:tim@brightblue.co.uk?subject=Bright.Blue%20at%20our%20venue",
  },
} as const;
