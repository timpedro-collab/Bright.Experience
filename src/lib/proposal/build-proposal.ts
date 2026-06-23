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
    durationLabel: string;
    dateLabel: string;
    rows: InvestmentRow[];
    note: string;
  };
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
    headline: () => "Turn footfall into real pipeline",
    challenge:
      "A passive stand collects business cards. The goal is a stand people walk toward — one that captures not just contact details, but context about who is genuinely interested.",
    success:
      "A busy stand with a steady stream of engaged visitors, and a follow-up list that is warm rather than cold — names paired with the context your sales team needs.",
  },
  leads: {
    headline: () => "Turn footfall into real pipeline",
    challenge:
      "A passive stand collects business cards. The goal is a stand people walk toward — one that captures not just contact details, but context about who is genuinely interested.",
    success:
      "A busy stand with a steady stream of engaged visitors, and a follow-up list that is warm rather than cold — names paired with the context your sales team needs.",
  },
  "brand-awareness": {
    headline: (co) => `Make ${co} the most talked-about presence in the room`,
    challenge:
      "Attention is scarce and every brand is competing for it. A static presence blends in. You need something that pulls people in and leaves a clear, lasting impression.",
    success:
      "Queues, high-score rivalry, and people dragging colleagues back for another go — and everyone walking away with a sharpened sense of who you are.",
  },
  sampling: {
    headline: (co) => `Put ${co} in people's hands`,
    challenge:
      "Handing out product passively gets product into bags, not minds. The goal is trial that comes with engagement, so the sample is earned and remembered.",
    success:
      "A stream of attendees playing, winning, and collecting your product — leaving with a genuine first experience of the brand, not just a freebie.",
  },
  "product-launch": {
    headline: (co) => `Launch with a moment people remember`,
    challenge:
      "A launch needs a centrepiece. Without one, the message competes with the noise of the room and gets lost.",
    success:
      "A crowd around the launch, hands-on interaction with the new product story, and attendees leaving able to repeat your key message.",
  },
  social: {
    headline: (co) => `Grow ${co}'s following on the floor`,
    challenge:
      "Social reach built at events is usually accidental. The goal is to make following you part of the experience — a natural, opt-in step, not a hard ask.",
    success:
      "A measurable lift in followers and engagement, captured in the moment of delight when an attendee wins.",
  },
};

const DEFAULT_NARRATIVE = {
  headline: (co: string) => `An interactive centrepiece built around ${co}`,
  challenge:
    "A passive stand won't shift perception or drive traffic. The space needs something people walk toward, not past.",
  success:
    "A busy stand, real engagement, and attendees walking away with a prize and a clear impression of your brand.",
};

/* Rationale shown when an add-on is "called out" as tailored to the brief. */
const ADDON_REASON: Record<string, string> = {
  "live-telemetry":
    "you want real pipeline — your team sees every lead the moment it lands",
  "sampling-unlock":
    "trial is central to your goal — a sample dispenses on every win",
  "linkedin-follow":
    "you want to grow your following — players follow you for an extra entry before claiming their prize",
  "survey-layer":
    "you want richer insight — a single smart question slots in between rounds",
  "dynamic-sponsors":
    "your activation can carry rotating sponsor or campaign creative between plays",
  "age-verification":
    "your products are age-restricted — an age gate unlocks play",
  "payments-onunit": "you want to take payment directly on the unit",
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
    reason: ADDON_REASON[c.slug] ?? "it fits the goals you outlined",
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
      intro: `A fully branded, interactive ${device} on your stand. Attendees play, compete, share details, and collect prizes — every touchpoint tells your story, from the machine wrap to the game to the idle-screen video between interactions.`,
      cascade: [
        { step: 1, title: "Approach", body: "Attendee sees the branded machine. The idle screen plays your brand story on loop." },
        { step: 2, title: "Play", body: "Tap to start. A fully branded game with your colours, icons, and theming. A high-score leaderboard drives repeat play." },
        { step: 3, title: "Scan", body: "A post-game QR code opens a web form on their phone — name plus the qualifying questions you define." },
        { step: 4, title: "Submit", body: 'Form submission triggers the machine instantly. The screen updates: "Your prize is on its way."' },
        { step: 5, title: "Collect", body: "The attendee collects their prize and walks away with a branded item and a clear brand impression." },
      ],
    },
    creative: {
      headline: "Your brand, A to Z",
      intro: `Every element of the activation is built around ${company}'s brand identity. The machine will look, feel, and play like it was built by your team.`,
      items: [
        { title: "Machine wrap", body: "Full exterior wrap in your creative — messaging, brand colours, and campaign visuals. The machine becomes a branded installation, not a generic unit." },
        { title: "Idle-screen video", body: "When nobody is playing, the 55-inch screen runs a looping video — your moment to tell the brand story. Content supplied by your team or built collaboratively." },
        { title: "Game design", body: "The tap-to-play game is fully branded: your colours, logos, and themed assets. You supply assets via a brief; our creative team builds it in." },
        { title: "Web form", body: "Light-touch data capture: name plus 1–2 qualifying questions that give your team context for follow-up. Kept non-invasive and fun." },
      ],
      processNote:
        "After agreement, Bright.Blue schedules a creative call with your brand and design team. We outline the assets needed, your team supplies them, and we build the wrap, game, and screen content. We can also handle creative end-to-end as an additional service.",
    },
    dataCapture: {
      headline: "Rich data without the friction",
      intro: `The machine adds a layer of rich, contextual data on top of whatever attendee list you already receive — captured from people who actively engaged with ${company}.`,
      rows: [
        { source: "Machine web form", what: "Name plus in-play questions (e.g. priorities, product interest, current setup)", how: "QR code after gameplay opens a branded form on the attendee's phone" },
        { source: "Engagement metrics", what: "Plays, dwell, peak times, and leaderboard activity across the event", how: "Captured automatically and delivered in your post-event report" },
        { source: "Combined", what: "Engaged-visitor shortlist cross-referenced with your own delegate data", how: "Post-event data merge by your team" },
      ],
      valueNote:
        "Instead of a flat list, your team gets a shortlist of people who actively engaged, with context about what they care about — turning a cold follow-up into a warm conversation.",
    },
    included: {
      headline: "Turnkey activation package",
      intro: `One fee, everything managed. ${company} provides creative assets and giveaway items; Bright.Blue handles the rest.`,
      brightBlueItems,
      customerItems,
    },
    investment: {
      headline: "One fee, everything included",
      feeLabel: "Turnkey activation fee",
      feePence: quote.total_amount ?? 0,
      durationLabel: `${days} day${days === 1 ? "" : "s"}`,
      dateLabel,
      rows,
      note: "All amounts exclude VAT. Bespoke creative design (handled end-to-end by Bright.Blue rather than supplied) and giveaway products are scoped separately.",
    },
    timeline: {
      headline: "Working backwards from the event",
      intro:
        "The timeline below works backwards from your event date to ensure everything is tested, produced, and ready in time.",
      milestones,
      note: "Locking the direction promptly gives us the most time for creative, production, and testing.",
    },
    nextSteps: {
      headline: "Getting started",
      intro: "A short, clear path from here to live.",
      actions: [
        { n: 1, action: "Book your 15-minute walkthrough so we can talk you through this proposal and tailor the detail.", owner: "Both" },
        { n: 2, action: "Confirm the activation direction and game concept.", owner: company },
        { n: 3, action: "Creative call with your brand and design team to brief assets.", owner: "Both" },
        { n: 4, action: "Ship giveaway product samples to Bright.Blue HQ for testing.", owner: company },
        { n: 5, action: "Activation goes live.", owner: "Both" },
      ],
      note: "No idea is too creative to explore — anything outside the standard format can be scoped by our development team.",
    },
    recommendedAddons,
  };
}

/** The always-on capabilities, exposed for the proposal's "always included" strip. */
export const ALWAYS_ON_OUTCOMES = ALWAYS_ON.map((c) => c.outcome);
