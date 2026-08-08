/**
 * Proposal document generator.
 *
 * Turns a quote (intake answers + selected add-ons + pricing) into the
 * structured, narrative proposal the customer reads — the same 10-section
 * shape as a hand-built Bright.Blue proposal. Everything here is derived
 * deterministically from the quote so a draft exists the moment an intake
 * lands; an AE can later override the narrative fields (next phase).
 *
 * Pure module — no DB, no React — so it's trivially testable and reusable.
 */

import { getCapabilities, ALWAYS_ON } from "@/lib/capabilities";
import { formatDateMedium, formatDateShort } from "@/lib/dates";
import { formatNumberUS } from "@/lib/currency";
import { indicativePriceBand, type PriceBand } from "@/lib/proposals/price-band";

/* -------------------------------------------------------------------------
 * Input + output shapes
 * ---------------------------------------------------------------------- */

export interface ProposalQuoteInput {
  id: string;
  company_name?: string | null;
  contact_name?: string | null;
  event_type?: string | null;
  objective?: string | null;
  venue_name?: string | null;
  event_date_start?: string | null;
  event_date_end?: string | null;
  machine_preference?: string | null;
  footfall_estimate_text?: string | null;
  creative_needs?: string | null;
  special_requirements?: string | null;
  addons?: unknown;
  total_amount?: number | null;
  quote_line_items?: { label: string; amount: number; sort_order: number }[] | null;
  // Projected reach (carried from the quiz through intake).
  reach_track?: string | null;
  attendees?: number | null;
  activation_location?: string | null;
  activation_days?: number | null;
  estimated_impressions?: number | null;
  estimated_interactions?: number | null;
  estimated_leads?: number | null;
  /** DOOH media value in integer USD cents. */
  dooh_media_value?: number | null;
}

export interface ProposalFact {
  label: string;
  value: string;
}

export interface CascadeStep {
  step: number;
  title: string;
  body: string;
}

export interface IncludedItem {
  title: string;
  body: string;
}

export interface DataCaptureRow {
  source: string;
  what: string;
  how: string;
}

export interface InvestmentRow {
  label: string;
  status: string;
}

export interface TimelineMilestone {
  n: number;
  milestone: string;
  owner: string;
  target: string;
}

export interface NextStepAction {
  n: number;
  action: string;
  owner: string;
}

export interface RecommendedAddon {
  slug: string;
  outcome: string;
  reason: string;
}

export interface ProposalPathway {
  /** Card eyebrow ("Our recommendation" / "The alternative"). */
  tag: string;
  title: string;
  body: string;
}

export interface ProposalReach {
  track: string;
  /** e.g. "London Waterloo · 3 days" or "2,500 attendees". */
  context: string;
  impressions: number;
  interactions: number;
  leads: number;
  /** Equivalent OOH media value in integer USD cents (experiential only). */
  doohMediaValueCents?: number;
}

export interface ProposalDocument {
  cover: {
    title: string;
    subtitle: string;
    facts: ProposalFact[];
    confidentialTag: string;
  };
  /** Projected reach band — present only when the intake captured reach data. */
  reach?: ProposalReach;
  brief: { headline: string; intro: string; challenge: string; success: string };
  solution: { headline: string; intro: string; cascade: CascadeStep[] };
  creative: {
    headline: string;
    intro: string;
    items: IncludedItem[];
    processNote: string;
  };
  dataCapture: {
    headline: string;
    intro: string;
    rows: DataCaptureRow[];
    valueNote: string;
  };
  included: {
    headline: string;
    intro: string;
    brightBlueItems: IncludedItem[];
    customerItems: IncludedItem[];
  };
  investment: {
    headline: string;
    feeLabel: string;
    feePence: number;
    /** Guide band shown before the walkthrough reveals the exact fee. */
    indicativeBand: PriceBand | null;
    durationLabel: string;
    dateLabel: string;
    rows: InvestmentRow[];
    note: string;
  };
  /**
   * One clear recommendation plus exactly one alternative — a decision
   * between two shapes, not a menu of twelve.
   */
  pathways: { recommended: ProposalPathway; alternative: ProposalPathway };
  timeline: {
    headline: string;
    intro: string;
    milestones: TimelineMilestone[];
    note: string;
  };
  nextSteps: {
    headline: string;
    intro: string;
    actions: NextStepAction[];
    note: string;
  };
  recommendedAddons: RecommendedAddon[];
}

/* -------------------------------------------------------------------------
 * Small date helpers (work on yyyy-mm-dd, no timezone surprises)
 * ---------------------------------------------------------------------- */

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function durationDays(start?: string | null, end?: string | null): number {
  if (!start) return 1;
  if (!end) return 1;
  const [ys, ms, ds] = start.split("T")[0].split("-").map(Number);
  const [ye, me, de] = end.split("T")[0].split("-").map(Number);
  const a = new Date(ys, ms - 1, ds).getTime();
  const b = new Date(ye, me - 1, de).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

/* -------------------------------------------------------------------------
 * Narrative copy keyed off the customer's stated objective
 * ---------------------------------------------------------------------- */

const OBJECTIVE_NARRATIVE: Record<
  string,
  { headline: (co: string) => string; challenge: string; success: string }
> = {
  "lead-generation": {
    headline: () => "Turn stand traffic into qualified leads",
    challenge:
      "A standard stand collects business cards and little else. You need a reason for people to stop, and a way to capture who they are and what brought them over.",
    success:
      "A steady flow of engaged visitors and a follow-up list your sales team can actually work, with the context behind every name.",
  },
  leads: {
    headline: () => "Turn stand traffic into qualified leads",
    challenge:
      "A standard stand collects business cards and little else. You need a reason for people to stop, and a way to capture who they are and what brought them over.",
    success:
      "A steady flow of engaged visitors and a follow-up list your sales team can actually work, with the context behind every name.",
  },
  "brand-awareness": {
    headline: (co) => `Make ${co} the presence people remember`,
    challenge:
      "Attention is scarce and every brand is competing for it. A static stand blends in. You need something that draws people over and leaves a clear impression.",
    success:
      "Queues at the stand, friendly competition on the leaderboard, and visitors who leave knowing exactly who you are.",
  },
  sampling: {
    headline: (co) => `Put ${co} in people's hands`,
    challenge:
      "Handing out product passively fills tote bags, not memories. Trial works when people earn the sample and engage with the brand as they do.",
    success:
      "A steady stream of visitors playing, winning, and leaving with your product and a genuine first impression of the brand.",
  },
  "product-launch": {
    headline: () => "Launch with a moment people remember",
    challenge:
      "A launch needs a focal point. Without one, the message gets lost in the noise of the room.",
    success:
      "A crowd around the launch, hands-on time with the product story, and visitors who can repeat your key message afterwards.",
  },
  social: {
    headline: (co) => `Grow ${co}'s following on the floor`,
    challenge:
      "Social reach at events is usually left to chance. Following you should be a natural, opt-in part of the experience, not a hard ask.",
    success:
      "A measurable lift in followers and engagement, captured in the moment a visitor wins.",
  },
};

const DEFAULT_NARRATIVE = {
  headline: (co: string) => `An interactive centrepiece built around ${co}`,
  challenge:
    "A passive stand won't shift perception or drive traffic. The space needs something people walk toward, not past.",
  success:
    "A busy stand, real engagement, and visitors who leave with a prize and a clear impression of your brand.",
};

/* Short rationale tying each called-out add-on back to the brief. Kept brief so
 * it justifies the choice without restating the outcome it sits beside. */
const ADDON_REASON: Record<string, string> = {
  "lead-capture": "You asked for first-party data.",
  "live-telemetry": "Pipeline is your priority.",
  "sampling-unlock": "Product trial is central to your goal.",
  "linkedin-follow": "You want to grow your following.",
  "survey-layer": "You asked for richer insight.",
  "dynamic-sponsors": "Useful when you're carrying sponsor or campaign creative.",
  "age-verification": "Your products are age-restricted.",
  "payments-onunit": "You want to take payment on the unit.",
};

/* -------------------------------------------------------------------------
 * The generator
 * ---------------------------------------------------------------------- */

export function buildProposalDocument(quote: ProposalQuoteInput): ProposalDocument {
  const company = (quote.company_name || "your brand").trim();
  const objective = (quote.objective || "").trim();
  const start = quote.event_date_start ?? null;
  const end = quote.event_date_end ?? null;
  const days = durationDays(start, end);
  const device = (quote.machine_preference || "Experience Portal").trim();

  const dateLabel =
    start && end
      ? `${formatDateShort(start)}–${formatDateMedium(end)}`
      : start
        ? formatDateMedium(start)
        : "Dates to confirm";

  const narrative = OBJECTIVE_NARRATIVE[objective] ?? DEFAULT_NARRATIVE;

  // ---- Projected reach band ---------------------------------------------
  const posInt = (v: number | null | undefined): number | null =>
    typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  const impressions = posInt(quote.estimated_impressions);
  const interactions = posInt(quote.estimated_interactions);
  const leads = posInt(quote.estimated_leads);
  const dooh = posInt(quote.dooh_media_value);
  let reach: ProposalReach | undefined;
  if (impressions || interactions || leads) {
    const isExperiential = quote.reach_track === "experiential";
    const context = isExperiential
      ? `${quote.activation_location ?? quote.venue_name ?? "Your site"}${
          quote.activation_days ? ` · ${quote.activation_days} day${quote.activation_days === 1 ? "" : "s"}` : ""
        }`
      : quote.attendees
        ? `${formatNumberUS(quote.attendees)} attendees`
        : "Your event";
    reach = {
      track: isExperiential ? "experiential" : "tradeshow",
      context,
      impressions: impressions ?? 0,
      interactions: interactions ?? 0,
      leads: leads ?? 0,
      doohMediaValueCents: dooh ?? undefined,
    };
  }

  const recommendedSlugs = Array.isArray(quote.addons)
    ? (quote.addons.filter((x): x is string => typeof x === "string"))
    : [];
  const recommendedCaps = getCapabilities(recommendedSlugs);
  const recommendedAddons: RecommendedAddon[] = recommendedCaps.map((c) => ({
    slug: c.slug,
    outcome: c.outcome,
    reason: ADDON_REASON[c.slug] ?? "It fits the goals you outlined.",
  }));

  // ---- What's included ---------------------------------------------------
  const brightBlueItems: IncludedItem[] = [
    {
      title: device,
      body: "55\" touchscreen unit, configured and tested for your giveaway products.",
    },
    {
      title: "Custom wrap",
      body: `Full exterior wrap designed and produced in ${company} branding.`,
    },
    {
      title: "Game implementation",
      body: "Branded tap-to-play game with high-score leaderboard, built by our creative team.",
    },
    {
      title: "Screen content",
      body: "Idle-screen video setup and content integration.",
    },
    {
      title: "Web form",
      body: "Custom data-capture form, branded and configured to your questions.",
    },
    {
      title: "Logistics",
      body: "Delivery to venue, setup, and collection post-event.",
    },
    {
      title: "On-site support",
      body: `Bright.Blue team member on-site across all ${days} event day${days === 1 ? "" : "s"} for setup, training, and machine management.`,
    },
    {
      title: "Product testing",
      body: "Your giveaway items shipped to us in advance, tested and configured for smooth dispensing.",
    },
  ];

  const customerItems: IncludedItem[] = [
    {
      title: "Creative assets",
      body: "Brand toolkit, logos, colours, and campaign visuals for the wrap and game.",
    },
    {
      title: "Giveaway products",
      body: "Branded merch shipped to Bright.Blue HQ (Milton Keynes) for testing.",
    },
    {
      title: "Idle-screen video",
      body: "Brand or campaign video content for the idle-screen loop.",
    },
  ];

  // ---- Investment rows ---------------------------------------------------
  const lineItems = (quote.quote_line_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
  const rows: InvestmentRow[] =
    lineItems.length > 0
      ? lineItems.map((li) => ({ label: li.label, status: "Included" }))
      : brightBlueItems.map((i) => ({ label: i.title, status: "Included" }));

  // ---- One recommendation, one alternative --------------------------------
  // Deliberately a choice between two shapes rather than a menu: the config
  // in this proposal is the recommendation; the alternative flexes the one
  // lever (duration) that most changes cost and risk.
  const recommended: ProposalPathway = {
    tag: "Our recommendation",
    title: `${device} · ${days} day${days === 1 ? "" : "s"}, fully managed`,
    body: `Everything in this proposal — wrap, game, data capture, logistics and on-site support — sized to the brief you gave us. This is the shape we'd run for ${company}.`,
  };
  const alternative: ProposalPathway =
    days > 1
      ? {
          tag: "The alternative",
          title: "Start with a one-day pilot",
          body: "Run day one only, watch the queue form, then extend on the spot. Same wrap, same game — you just commit to less up front. Ask on your walkthrough and we'll price both.",
        }
      : {
          tag: "The alternative",
          title: "Add a second live day",
          body: "The wrap and game are already built, so extra days cost logistics and support, not production. If footfall runs over more than one day, this is the better value. Ask on your walkthrough and we'll price both.",
        };

  // ---- Timeline (works backwards from the event) -------------------------
  const milestones: TimelineMilestone[] = start
    ? [
        { n: 1, milestone: "Confirm activation and game direction", owner: company, target: formatDateShort(addDays(start, -21)) },
        { n: 2, milestone: "Creative call: assets, wrap brief, game brief", owner: "Both", target: formatDateShort(addDays(start, -20)) },
        { n: 3, milestone: "Brand assets and idle-screen video supplied", owner: company, target: formatDateShort(addDays(start, -17)) },
        { n: 4, milestone: "Giveaway products shipped to Bright.Blue HQ", owner: company, target: formatDateShort(addDays(start, -17)) },
        { n: 5, milestone: "Wrap design produced and approved", owner: "Both", target: formatDateShort(addDays(start, -14)) },
        { n: 6, milestone: "Game build complete, web form configured", owner: "Bright.Blue", target: formatDateShort(addDays(start, -14)) },
        { n: 7, milestone: "Machine wrapped, products tested, full dry run", owner: "Bright.Blue", target: formatDateShort(addDays(start, -7)) },
        { n: 8, milestone: "Machine delivered to venue, set up, live", owner: "Bright.Blue", target: formatDateShort(start) },
        { n: 9, milestone: `Live activation (${days} day${days === 1 ? "" : "s"})`, owner: "Both", target: dateLabel },
        { n: 10, milestone: "Machine collected, web form data delivered", owner: "Bright.Blue", target: formatDateShort(addDays(end ?? start, 1)) },
      ]
    : [];

  return {
    cover: {
      title: `${company} Activation`,
      subtitle: `Interactive brand experience · ${dateLabel}`,
      facts: [
        { label: "Event duration", value: `${days} day${days === 1 ? "" : "s"}` },
        { label: "Device", value: `1 ${device}` },
        { label: "Fully managed", value: "Turnkey" },
        { label: "Similar activations", value: "40+ this year" },
      ],
      confidentialTag: "Confidential",
    },
    reach,
    brief: {
      headline: narrative.headline(company),
      intro: quote.special_requirements?.trim()
        ? quote.special_requirements.trim()
        : `${company} needs an interactive centrepiece${quote.venue_name ? ` at ${quote.venue_name}` : ""} that drives footfall, reinforces the brand story, and earns attention in a crowded room.`,
      challenge: narrative.challenge,
      success: narrative.success,
    },
    solution: {
      headline: `Gamified brand activation on the ${device}`,
      intro: `A fully branded, interactive ${device} on your stand. Visitors play, compete, share their details, and collect a prize. Every touchpoint tells your story, from the machine wrap to the game to the idle-screen video between plays.`,
      cascade: [
        { step: 1, title: "Approach", body: "The visitor sees the branded machine. The idle screen plays your brand story on loop." },
        { step: 2, title: "Play", body: "Tap to start a fully branded game in your colours, icons, and theming. A high-score leaderboard drives repeat play." },
        { step: 3, title: "Scan", body: "A post-game QR code opens a short form on their phone: their name plus the qualifying questions you define." },
        { step: 4, title: "Submit", body: 'Submitting the form triggers the machine instantly. The screen updates to "Your prize is on its way."' },
        { step: 5, title: "Collect", body: "The visitor collects their prize and leaves with a branded item and a clear impression of the brand." },
      ],
    },
    creative: {
      headline: "Your brand, end to end",
      intro: `Every element of the activation is built around ${company}'s brand identity. The machine looks, feels, and plays like your own team built it.`,
      items: [
        { title: "Machine wrap", body: "Full exterior wrap in your creative: messaging, brand colours, and campaign visuals. The machine becomes a branded installation, not a generic unit." },
        { title: "Idle-screen video", body: "When nobody is playing, the 55-inch screen runs a looping video to tell your brand story. You supply the content, or we build it with you." },
        { title: "Game design", body: "The tap-to-play game is fully branded in your colours, logos, and themed assets. You supply the assets against a brief and our creative team builds it in." },
        { title: "Web form", body: "A name and one or two qualifying questions that give your team context for follow-up. Short and easy to complete." },
      ],
      processNote:
        "Once you sign off, we schedule a creative call with your brand and design team. We confirm the assets we need, you supply them, and we build the wrap, game, and screen content. If you would rather not produce the assets in-house, we can handle the creative for you as an added service.",
    },
    dataCapture: {
      headline: "Rich data without the friction",
      intro: `The machine adds contextual data on top of any attendee list you already receive, captured from the people who actively engaged with ${company}.`,
      rows: [
        { source: "Machine web form", what: "Name plus in-play questions (for example priorities, product interest, current setup)", how: "A QR code after gameplay opens a branded form on the visitor's phone" },
        { source: "Engagement metrics", what: "Plays, dwell, peak times, and leaderboard activity across the event", how: "Captured automatically and delivered in your post-event report" },
        { source: "Combined", what: "Engaged-visitor shortlist cross-referenced with your own delegate data", how: "Post-event data merge by your team" },
      ],
      valueNote:
        "Instead of a flat list, your team gets a shortlist of people who genuinely engaged, with context on what they care about. That turns a cold follow-up into a warm conversation.",
    },
    included: {
      headline: "Turnkey activation package",
      intro: `One fee, fully managed. ${company} provides the creative assets and giveaway items, and Bright.Blue handles everything else.`,
      brightBlueItems,
      customerItems,
    },
    investment: {
      headline: "One fee, everything included",
      feeLabel: "Turnkey activation fee",
      feePence: quote.total_amount ?? 0,
      indicativeBand: indicativePriceBand(quote.total_amount ?? 0),
      durationLabel: `${days} day${days === 1 ? "" : "s"}`,
      dateLabel,
      rows,
      note: "All amounts exclude VAT. Bespoke creative design (handled end-to-end by Bright.Blue rather than supplied) and giveaway products are scoped separately.",
    },
    pathways: { recommended, alternative },
    timeline: {
      headline: "Working backwards from the event",
      intro:
        "This timeline works backwards from your event date so everything is produced, tested, and ready in time.",
      milestones,
      note: "Locking the direction early gives us the most time for creative, production, and testing.",
    },
    nextSteps: {
      headline: "Getting started",
      intro: "A short, clear path from here to live.",
      actions: [
        { n: 1, action: "Book your 15-minute walkthrough so we can talk you through this proposal and tailor the detail.", owner: "Both" },
        { n: 2, action: "Confirm the activation direction and game concept.", owner: company },
        { n: 3, action: "Join a creative call with your brand and design team to brief the assets.", owner: "Both" },
        { n: 4, action: "Ship giveaway product samples to Bright.Blue HQ for testing.", owner: company },
        { n: 5, action: "Go live.", owner: "Both" },
      ],
      note: "If you have something more ambitious in mind, our development team can scope anything beyond the standard format.",
    },
    recommendedAddons,
  };
}

/** The always-on capabilities, exposed for the proposal's "always included" strip. */
export const ALWAYS_ON_OUTCOMES = ALWAYS_ON.map((c) => c.outcome);
