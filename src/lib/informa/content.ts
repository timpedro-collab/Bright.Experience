/**
 * Bright.Blue × Informa — every fact, claim and line of copy for the pitch
 * deck (`/informa`) and the seller's kit (`/informa/kit`).
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
 * prospectuses and rate cards, August 2026 (docs/research/2026-08-market),
 * plus Freeman's public Envision listings (HIMSS 2023–2026).
 *
 * Deliberately NOT "nobody sells this": Freeman's Envision machines at HIMSS
 * are priced, listed and sold out — and the room can verify that on a phone.
 * The gap is that the one comparable is the contractor's product, per show,
 * with no measurement attached. Envision is our demand proof, not a landmine.
 */
export const GAP_CLAIMS = [
  {
    claim:
      "The demand is proven, and priced: Freeman's Envision machines at HIMSS list at $42–45k for 2026, and the slots show sold.",
    support:
      "Sold to Salesforce and CoverMyMeds, up from $25–27.5k in 2023. The one comparable that exists sells out at rising prices — public listings, verifiable in this room.",
  },
  {
    claim: "But that line belongs to the services contractor, one show at a time — it is not a product in the organizer's book.",
    support:
      "Across 30+ organizer prospectuses reviewed, the organizer-side activation line is still \"custom activations\": contact-sales, bespoke, never a rate-carded product a rep can close in one meeting.",
  },
  {
    claim: "And nobody — Envision included — attaches measured performance to the line item.",
    support:
      "Signage, lanyards and banners sell on position and size. No expected plays, leads or engagement next to the price, and no proof-of-performance report after the show.",
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

/**
 * The 2027 roadmap slide. The sales psychology is deliberate:
 *
 *   - "Live today" anchors the frame, so the roadmap reads as momentum on
 *     a shipping platform, never as promises standing in for product.
 *   - Each 2027 item extends something already live (the report becomes a
 *     dashboard, the lead file becomes a CRM sync, one report becomes a
 *     cross-show comparison) — evolution is believable, invention is not.
 *   - The closer removes the "let's wait for 2027" objection: releases
 *     land inside the same agreement, pilot partners first, and portfolio
 *     benchmarking only works for shows already generating data. Waiting
 *     costs the buyer, acting early pays them.
 *
 * Compliance note: this is the ONE surface allowed to say "live lead
 * dashboard" — it is dated as in-build, never claimed as a present
 * capability (see the TWO_MODELS data-posture note below).
 */
export const ROADMAP_2027 = {
  overline: "Where this goes",
  headline: "Live today. Compounding through 2027.",
  intro:
    "Everything on the left ships with Tampa. Everything on the right is in build and lands inside the same agreement — the program grows without a new negotiation.",
  liveNow: {
    title: "Live today",
    items: [
      "Badge-gated plays with opted-in lead capture",
      "Board-ready proof-of-performance report within 24 hours of close",
      "Operational telemetry keeping every deployed machine healthy",
      "One rate card and reporting format across the portfolio",
    ],
  },
  inBuild: {
    title: "In build — live in 2027",
    items: [
      {
        title: "Live lead dashboard",
        detail:
          "Sponsors watch plays and opted-in leads land in real time, mid-show. The 24-hour report becomes the recap, not the reveal.",
      },
      {
        title: "CRM integrations",
        detail:
          "Opted-in leads flow straight into the sponsor's Salesforce or HubSpot, consent attached. No CSV, no manual handoff, no decay.",
      },
      {
        title: "Portfolio benchmarking",
        detail:
          "Repeat sponsors compare their numbers across your shows — which quietly turns one good result into a booking at the next city.",
      },
    ],
  },
  closer:
    "Pilot partners shape this roadmap and take each release first, inside the agreement they already signed — no new line on the order. And benchmarking only pays off for shows already generating data, so the calendar you start now is the head start.",
} as const;

/**
 * The two-model decision (Catherine's framing, kept compliant): Informa can
 * resell placements or run the platform for its own show, and Tampa already
 * does both. Data claims stay sponsor-owned: leads belong to the sponsor who
 * paid, Informa gets performance reporting for renewal conversations. No
 * audience-profiling or data-pool claims. Platform monitoring is framed as
 * operational telemetry, never as live lead dashboards.
 */
export const TWO_MODELS = {
  headline: "Two ways to run it. Tampa runs both.",
  models: [
    {
      name: "Sell it",
      descriptor: "A premium line in your prospectus",
      detail:
        "Your reps sell Bright.Blue placements to sponsors and exhibitors as differentiated, engagement-priced inventory. Bright.Blue delivers; you book the margin.",
      tampa: "Registration and the Experiential Media Lounge in Tampa run this way.",
    },
    {
      name: "Run it",
      descriptor: "An Informa-branded experience layer",
      detail:
        "Informa uses the platform on its own account: show-branded machines working on show-team numbers, like at-show rebooking, with the same measurement behind them.",
      tampa: "The rebooking machine on the Informa booth in Tampa runs this way.",
    },
  ],
  note: "Not a fork in the road: the same fleet, agreement and reporting rails carry both, so the mix can change show by show.",
  dataPosture:
    "Every lead belongs to the sponsor who paid for the placement, captured with opt-in consent at the machine. Informa receives proof-of-performance reporting for renewal conversations, and Bright.Blue's operational telemetry keeps every deployed machine healthy through the show.",
} as const;

/** Portfolio portability: one platform across Informa's formats. */
export const PORTABILITY = {
  headline: "Built for the format, not just the booth",
  formats: [
    {
      format: "Expo floors",
      line: "Registration, lounges, aisles and sponsor stands: the classic placements.",
    },
    {
      format: "Conferences",
      line: "Foyers and networking breaks, where a smaller audience has longer dwell.",
    },
    {
      format: "Festivals and town takeovers",
      line: "Self-contained and mobile: a square meter and a socket, indoors or under cover, wherever the audience is.",
    },
  ],
} as const;

/**
 * The close: one small, concrete ask, then the three things that happen
 * next — each one either already in motion or carried by Bright.Blue, so
 * saying yes costs Informa almost nothing.
 */
export const THE_ASK = {
  headline: "The ask",
  line: "Add the line. We'll make it the one sponsors renew for.",
  sub: "Name Bright.Blue in the sponsorship inventory of two or three shows next cycle. That's the whole ask — everything below it is already moving.",
  steps: [
    {
      title: "Tampa runs",
      detail: "Three machines live at Connect Marketplace — proof on your own show floor, not a case study.",
    },
    {
      title: "You name the shows",
      detail: "Two or three from next cycle's calendar. The rate card and pricing rails are already built.",
    },
    {
      title: "Reps sell, we deliver",
      detail: "The seller's kit is in their hands the same week. Build, crew, wrap and reporting stay our job.",
    },
  ],
} as const;

/* ------------------------------------------------------------------------
 * Seller's kit copy
 * ---------------------------------------------------------------------- */

/**
 * The 60-second rep script, in three beats.
 *
 * Structure follows the strategic-narrative school of pitching (Raskin,
 * Dunford, Klaff): the hook opens on an undeniable change in the buyer's
 * world — event spend now has to survive a finance review — rather than on
 * the product; the proof introduces the machine as the way to win that
 * review and closes the beat on a winners-and-losers contrast; the close
 * uses genuine scarcity (placements are capped per show) and a small,
 * reversible ask.
 */
export const REP_SCRIPT = [
  {
    beat: "The hook",
    script:
      "Three weeks from now, someone in your finance meeting is going to ask what this show actually produced. A pile of badge scans doesn't survive that question. The stands that keep their budgets are the ones that come home with opted-in leads and a number they can defend, and we built a machine that does exactly that, wrapped head to toe in your brand.",
  },
  {
    beat: "The proof",
    script:
      "It pulls a queue no static stand will: a fast branded game, badge-gated, so every play is a real registrant opting in, with preferences and context a scan alone never carries. Machines benchmark 150 to 220 plays a day, and they dispense as well as they play: drinks, snacks, beauty, merch. If it fits, it vends. Your proof-of-performance report lands within 24 hours of close, while everyone else is still counting scans.",
  },
  {
    beat: "The close",
    script:
      "It is one line on your sponsorship order, and we handle build, brand, crew and reporting end to end. Placements are capped per show and go to whoever commits first. Want me to hold one while you check budget?",
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
  "Screen time between plays: the machine's screens are yours alone, running your creative in a rolling loop on up to three screens depending on the machine",
  "A board-ready proof-of-performance report within 24 hours of close",
] as const;

/** How a rep protects a deal once a sponsor bites. */
export const DEAL_FLOW = [
  { step: "Register the conversation", detail: "One short form claims the sponsor before anyone quotes them." },
  { step: "Answer within 24 hours", detail: "Bright.Blue confirms availability and pricing inside one working day." },
  { step: "14 days of exclusivity", detail: "The registered deal is yours across every channel, including Bright.Blue's own inbound." },
] as const;

/**
 * Where a rep's completed deal brief lands. One constant so it can be
 * swapped when a dedicated partnerships inbox exists.
 */
export const KIT_BRIEF_EMAIL = "tim@brightblue.co.uk";

/**
 * The drop-in prospectus listing: copy a rep pastes straight into their own
 * sponsorship deck or inventory sheet. Written as inventory copy, not
 * marketing prose, so it survives the paste untouched.
 */
export const INVENTORY_LISTING = {
  title: "Interactive Brand Activation Machine",
  tier: "Premium engagement inventory · limited placements per show",
  body: "A full-size interactive game machine, wrapped edge to edge in your brand, positioned where the audience already is. Attendees scan their badge to play a custom branded game, opt in as they play, and win real rewards from the machine. You receive every opted-in lead with preferences attached, and a board-ready performance report within 24 hours of the show closing.",
  includes: [
    "Machine, custom branded game and full brand wrap",
    "Badge-gated plays with opted-in lead capture",
    "Optional product sampling or prize dispensing on wins",
    "Rotating screen creative between plays",
    "Delivery, install, on-site operation and teardown",
    "Proof-of-performance report within 24 hours of close",
  ],
  priceLine: "Price on application to your account team",
} as const;

/**
 * From signature to show day: the delivery story a rep can promise without
 * phoning anyone. Kept honest: creative lock is the only dated promise, and
 * it comes from the standard four-week production lead time.
 */
export const DELIVERY_TIMELINE = [
  {
    phase: "On signature",
    detail: "Bright.Blue's delivery team takes over from your rep. One kickoff call with the sponsor covers the game, the prize or sample, and the data capture.",
  },
  {
    phase: "About 4 weeks out",
    detail: "Brand assets and creative lock. Wrap production and game build start; the sponsor approves the design before anything prints.",
  },
  {
    phase: "Show week",
    detail: "Bright.Blue delivers, installs and tests the machine before doors. Your ops team provides the placement and a power socket; everything else is ours.",
  },
  {
    phase: "Doors open",
    detail: "Bright.Blue staff run the machine, restock rewards, and keep the queue moving. No workload lands on the show team.",
  },
  {
    phase: "Within 24 hours of close",
    detail: "The sponsor receives a board-ready proof-of-performance report. Your team gets the renewal ammunition at the same time.",
  },
] as const;

/** What the show's ops team must provision. Everything else is Bright.Blue's. */
export const SITE_REQUIREMENTS = [
  { need: "Floor space", detail: "About one square meter, plus queueing room in front" },
  { need: "Power", detail: "One standard power socket" },
  { need: "Placement", detail: "A spot the audience already passes: registration, a lounge, a main aisle" },
  { need: "Everything else", detail: "Build, wrap, freight, install, ops, teardown and reporting are all Bright.Blue's" },
] as const;

/**
 * Real activation photography for the kit's proof strip. `position` is the
 * CSS object-position for the 3:4 crop, so the machine stays in frame when
 * a landscape photo is cropped to a portrait tile.
 */
export const KIT_GALLERY = [
  {
    src: "/pitch/photos/pepsi-midplay-crowd.jpg",
    alt: "Attendee mid-play on a wrapped Pepsi machine while another films on his phone",
    position: "30% center",
  },
  {
    src: "/pitch/photos/pelion-expo-play.jpg",
    alt: "Attendee playing a fully wrapped machine on a live trade show floor",
    position: "58% center",
  },
  {
    src: "/pitch/photos/biba-leadenhall.jpg",
    alt: "Branded play-to-win machine drawing a queue at a conference activation",
    position: "35% center",
  },
  {
    src: "/pitch/photos/absolut-qr-scan.jpg",
    alt: "Attendee scanning the on-screen QR code with his phone on a bottle-locker machine",
    position: "42% center",
  },
] as const;
