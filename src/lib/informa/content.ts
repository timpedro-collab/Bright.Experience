/**
 * Bright.Blue × Informa — every fact, claim and line of copy for the pitch
 * deck (`/pitch/informa`) and the seller's kit (`/pitch/informa/kit`).
 *
 * One file on purpose: when a date, placement, or claim changes, it changes
 * here and nowhere else. Components render this data and never hard-code
 * buyer-facing copy.
 *
 * Copy rules: US English (Informa's US commercial teams are the audience,
 * matching /pp). No em dashes in buyer-facing strings. Projections are
 * labelled illustrative; verified numbers carry their source.
 */

/** The show that anchors act one of the pitch. */
export const TAMPA_SHOW = {
  name: "Connect Marketplace",
  dates: "August 24 to 26, 2026",
  venue: "Tampa Convention Center, Tampa Bay, FL",
  audience: "3,000+ MICE professionals",
  organizer: "Informa Connect",
} as const;

export interface TampaPlacement {
  id: string;
  /** Where the machine physically stands. */
  location: string;
  /** The job this placement does, in one line. */
  job: string;
  /** The longer story revealed on tap. */
  detail: string;
  /** Who this placement makes money or proof for. */
  beneficiary: string;
}

/**
 * The three Tampa placements. Three machines, three different jobs: that is
 * the whole "different ways to use Bright.Blue" argument in one show.
 */
export const TAMPA_PLACEMENTS: TampaPlacement[] = [
  {
    id: "registration",
    location: "Registration",
    job: "Own the arrival moment",
    detail:
      "Every attendee's first minutes at the show become a branded, measured interaction. Registration is the one place the entire audience passes, which makes it the most valuable sponsorship real estate in the building.",
    beneficiary: "Sellable as top-tier sponsor inventory",
  },
  {
    id: "media-lounge",
    location: "Experiential Media Lounge",
    job: "Showcase the category",
    detail:
      "A live demonstration of interactive activation as a media format, sitting inside the space Informa curates for exactly this. Attendees play, the lounge draws a crowd, and the format sells itself to every planner watching.",
    beneficiary: "The proof that fills next year's prospectus",
  },
  {
    id: "informa-booth",
    location: "Informa Booth",
    job: "Gamify rebooking for 2027",
    detail:
      "Attendees play to unlock next year. At-show rebooking is one of the most watched commercial numbers on any show team's dashboard, and this machine works on it directly. Not a sponsor's revenue. Informa's.",
    beneficiary: "Informa's own rebooking rate",
  },
];

/** The badge-gate claim, phrased to be true without overclaiming integration. */
export const BADGE_CLAIM =
  "Every play starts with a badge scan. No anonymous taps: every interaction begins with a real registrant.";

/**
 * What one play creates, in order. The data story slide walks these left to
 * right. Illustrative journey, not per-show telemetry.
 */
export const PLAY_JOURNEY = [
  { step: "Attract", line: "The machine stops traffic that signage never will." },
  { step: "Play", line: "A fast branded game with a score at the end." },
  { step: "Capture", line: "The badge scan opens the play. The opt-in flow goes further: preferences, answers and context a scan alone never carries." },
  { step: "Reward", line: "A prize, a sample, or next year's stand reserved." },
  { step: "Report", line: "A board-ready proof-of-performance report within 24 hours of close." },
] as const;

/**
 * The gap argument. Sources: Bright.Blue market research across 30+ organizer
 * prospectuses and rate cards, August 2026 (docs/research/2026-08-market).
 */
export const GAP_CLAIMS = [
  {
    claim: "Every prospectus sells \"custom activations.\" None of them price it, and none of them measure it.",
    support: "Across 30+ organizer prospectuses reviewed, the activation line is always contact-sales, bespoke, and never performance-quantified.",
  },
  {
    claim: "No organizer anywhere publishes expected performance next to sponsorship inventory.",
    support: "Signage, lanyards and banners are sold on position and size. Nobody attaches expected plays, leads, or engagement to the line item.",
  },
  {
    claim: "Branded game machines only reach shows when an exhibitor rents one directly.",
    support: "The format already works. It just is not in any organizer's book, so the organizer earns nothing from it.",
  },
] as const;

/** The offer: what an Activation SKU line in an Informa prospectus contains. */
export const ACTIVATION_SKU = {
  name: "The Activation SKU",
  tagline: "A line item your reps can price and close in one meeting.",
  parts: [
    { label: "Machine + placement", detail: "Wrapped in the sponsor's brand, positioned where the audience already is." },
    { label: "Expected performance", detail: "Plays and opted-in leads as a benchmarked range, printed on the line item." },
    { label: "A price your rep quotes live", detail: "No bespoke scoping call. The rep prices it in the sponsor meeting." },
    { label: "Zero operational lift", detail: "Bright.Blue handles build, wrap, delivery, install, ops, and reporting end to end." },
  ],
} as const;

/** The renewal-protection argument for slide six. */
export const RENEWAL_PITCH = {
  headline: "Sponsorship retention infrastructure",
  lines: [
    "A sponsor renews when their spend survives the internal meeting three weeks later.",
    "Every Bright.Blue placement ships a board-ready proof-of-performance report within 24 hours of doors closing. The industry norm is 48 to 72 hours, when it exists at all.",
    "Plays, opted-in leads, dwell, and engagement by hour. The renewal conversation starts with evidence instead of anecdotes.",
  ],
} as const;

/** The specific, small ask that closes the deck. */
export const THE_ASK = {
  headline: "The ask",
  line: "List Bright.Blue as a named line in the sponsorship prospectus of two or three shows next cycle. Tampa is the proof. Your reps get the kit the same week.",
} as const;

/* ------------------------------------------------------------------------
 * Seller's kit copy
 * ---------------------------------------------------------------------- */

/** The 60-second rep script, in three beats. */
export const REP_SCRIPT = [
  {
    beat: "The hook",
    script:
      "You know the busiest stand at every show is the one with a game on it. We can make that stand yours, wrapped in your brand, and every play captures an opted-in lead with their badge data attached.",
  },
  {
    beat: "The proof",
    script:
      "It is not a novelty. Each machine serves around 150 to 220 plays a day, and it dispenses as well as it plays: drinks, snacks, beauty, merch, prizes. If it fits, it vends. And you get a full proof-of-performance report within 24 hours of close, so you will know exactly what it did.",
  },
  {
    beat: "The close",
    script:
      "It is one line on your sponsorship order, we handle everything else end to end. Want me to hold the placement while you check budget?",
  },
] as const;

/** Three questions that qualify a sponsor in one conversation. */
export const QUALIFYING_QUESTIONS = [
  {
    question: "What does your stand need to do this year?",
    why: "Awareness, leads, or launch. The answer picks the game format and the data capture.",
  },
  {
    question: "How do you prove the show paid for itself?",
    why: "If they struggle to answer, the 24 hour report is the sale. Cost per opted-in lead is a number their CFO understands.",
  },
  {
    question: "Who follows up the leads, and how fast?",
    why: "Captured contacts flow to the sponsor's team with consent attached. If they have an SDR team waiting, the value lands immediately.",
  },
] as const;

/** Objections a rep will hear, with the honest answer. */
export const OBJECTIONS = [
  {
    objection: "Sponsors already scan badges at their stand.",
    answer:
      "A scan records who walked past. A play records two minutes of attention, a game score, declared preferences, and an opt-in. The lead arrives warm and the sponsor's follow-up has context.",
  },
  {
    objection: "We do not have floor space for this.",
    answer:
      "One machine needs about one square meter and a standard power socket. It fits registration, a lounge corner, or inside an existing sponsor stand.",
  },
  {
    objection: "What if it underperforms?",
    answer:
      "Performance is quoted as a range from comparable activations, never a promise. And every placement reports actuals within 24 hours, so nobody is left guessing either way.",
  },
  {
    objection: "This sounds operationally heavy for my team.",
    answer:
      "Your team sells the line item. Bright.Blue does build, wrap, freight, install, on-site ops, teardown, and reporting. There is no work package on the Informa side.",
  },
] as const;

/** What the sponsor gets, printed on the kit as a checklist. */
export const SPONSOR_GETS = [
  "A machine fully wrapped in their brand at a placement the whole audience passes",
  "A custom branded game, built and loaded by Bright.Blue",
  "Sampling on a win: the machine can be configured to dispense almost anything that fits, from drinks and snacks to beauty and merch",
  "Badge-gated plays: every interaction starts with a real registrant",
  "Opted-in leads with preference and context data far richer than a badge scan alone",
  "Screen time between plays: a rolling loop of six 10 second ad slots, run sole-sponsor or split and sold as separate inventory, on up to three screens depending on the machine",
  "A board-ready proof-of-performance report within 24 hours of close",
] as const;

/** How a rep protects a deal once a sponsor bites. */
export const DEAL_FLOW = [
  { step: "Register the conversation", detail: "One short form claims the sponsor before anyone quotes them." },
  { step: "Answer within 24 hours", detail: "Bright.Blue confirms availability and pricing inside one working day." },
  { step: "14 days of exclusivity", detail: "The registered deal is yours across every channel, including Bright.Blue's own inbound." },
] as const;
