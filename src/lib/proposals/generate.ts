/**
 * Auto-generate a structured proposal document from a quote.
 *
 * Pure, deterministic, no I/O — give it the quote fields (plus the resolved
 * capability slugs) and it returns a complete `ProposalContent` draft modelled
 * on the Bright.Blue proposal format. The AE then polishes the narrative and
 * confirms pricing; most of the document is filled in from data the customer
 * already gave us at intake.
 */

import {
  PROPOSAL_SCHEMA_VERSION,
  type ProposalContent,
  type ProposalMilestone,
} from "./document";
import { ALWAYS_ON, getCapabilities } from "@/lib/capabilities";

export interface ProposalGenerateInput {
  contactName?: string | null;
  companyName?: string | null;
  eventType?: string | null;
  objective?: string | null;
  venueName?: string | null;
  eventDateStart?: string | null;
  eventDateEnd?: string | null;
  machinePreference?: string | null;
  footfallText?: string | null;
  creativeNeeds?: string | null;
  engagementScope?: string | null;
  /** Narrative captured from the customer at intake. */
  briefChallenge?: string | null;
  briefSuccess?: string | null;
  qualifyingQuestions?: string | null;
  /** Canonical capability slugs the customer selected. */
  addons?: string[] | null;
  /** Total in pence, if already priced. */
  totalPence?: number | null;
  /** Account manager / AE name for the next-steps owners. */
  aeName?: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parse a YYYY-MM-DD (or ISO) string as a local date, or null. */
function parseDate(v?: string | null): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (!m) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function formatRange(start: Date | null, end: Date | null): string {
  if (!start) return "Dates to be confirmed";
  const sMonth = MONTHS[start.getMonth()];
  const year = start.getFullYear();
  if (end && (end.getMonth() !== start.getMonth() || end.getDate() !== start.getDate())) {
    if (end.getMonth() === start.getMonth()) {
      return `${sMonth} ${start.getDate()}\u2013${end.getDate()}, ${year}`;
    }
    return `${sMonth} ${start.getDate()} \u2013 ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${sMonth} ${start.getDate()}, ${year}`;
}

function durationDays(start: Date | null, end: Date | null): number {
  if (!start) return 1;
  if (!end) return 1;
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** "Mon 2 June" */
function formatDayTarget(d: Date): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Objective → a human brief heading + intro fragment. */
function objectiveNarrative(objective?: string | null): {
  heading: string;
  goal: string;
  challenge: string;
  success: string;
} {
  const o = (objective ?? "").toLowerCase();
  if (o.includes("lead")) {
    return {
      heading: "Turn stand traffic into qualified conversations",
      goal: "generate qualified leads and give the sales team warm conversations to follow up",
      challenge:
        "A passive stand blends into the room. The goal is to draw people in, get them engaged long enough to capture intent, and hand the team a shortlist of genuinely interested visitors \u2014 not a flat scan list.",
      success:
        "A busy stand with a steady queue, and a set of qualified leads with real context about what each visitor cares about.",
    };
  }
  if (o.includes("sampl") || o.includes("trial")) {
    return {
      heading: "Put product in hands and make it memorable",
      goal: "drive trial and sampling while capturing who engaged",
      challenge:
        "Handing out samples passively gets product moved but tells you nothing. The goal is to make sampling an experience people opt into \u2014 and to know who they were.",
      success:
        "High sampling volume, a queue that builds itself, and engaged data from the people who played.",
    };
  }
  if (o.includes("aware") || o.includes("brand") || o.includes("launch")) {
    return {
      heading: "Make the brand the most talked-about thing in the room",
      goal: "drive awareness and reframe how people see the brand",
      challenge:
        "Perception doesn't shift from a banner. The activation needs to be something people walk toward, play, and remember \u2014 and that they pull colleagues over to see.",
      success:
        "Crowds, repeat play, and attendees walking away with a clear, fresh impression of the brand.",
    };
  }
  return {
    heading: "An interactive centrepiece that earns attention",
    goal: "drive footfall and engagement and leave a lasting brand impression",
    challenge:
      "A passive presence is easy to walk past. The activation needs to be something people walk toward, engage with, and remember.",
    success:
      "A busy, talked-about stand and engaged attendees who leave with a clear brand impression.",
  };
}

const STANDARD_STEPS = [
  {
    label: "Approach",
    body:
      "Attendee sees the branded machine. The idle screen plays your story on loop, pulling people in from across the room.",
  },
  {
    label: "Play",
    body:
      "Tap to start. A fully branded game in your colours, icons, and theming. A high-score leaderboard drives repeat play and friendly competition.",
  },
  {
    label: "Scan",
    body:
      "A post-game QR code opens a web form on their phone \u2014 name plus the qualifying questions you define.",
  },
  {
    label: "Submit",
    body:
      "Form submission triggers the machine instantly. The screen updates: \u201cYour prize is on its way.\u201d",
  },
  {
    label: "Collect",
    body:
      "Attendee collects their prize and walks away with a branded item and a clear brand impression.",
  },
];

/** Build the timeline working backwards from the event start date. */
function buildTimeline(start: Date | null, end: Date | null): {
  intro: string;
  milestones: ProposalMilestone[];
  note: string;
} {
  const relative = (offset: number) =>
    start ? formatDayTarget(addDays(start, offset)) : "TBC";

  const milestones: ProposalMilestone[] = [
    { milestone: "Confirm activation and game direction", owner: "You", target: relative(-21) },
    { milestone: "Creative call: assets, wrap brief, game brief", owner: "Both", target: relative(-20) },
    { milestone: "Supply brand assets and idle-screen video", owner: "You", target: relative(-17) },
    { milestone: "Ship giveaway products to Bright.Blue HQ (Milton Keynes)", owner: "You", target: relative(-17) },
    { milestone: "Wrap design produced and approved", owner: "Both", target: relative(-14) },
    { milestone: "Game build complete, web form configured", owner: "Bright.Blue", target: relative(-14) },
    { milestone: "Machine wrapped, products tested, full dry run", owner: "Bright.Blue", target: relative(-7) },
    { milestone: "Machine delivered to venue, set up, live", owner: "Bright.Blue", target: start ? formatDayTarget(start) : "Event day" },
    {
      milestone: "Event live",
      owner: "Both",
      target: formatRange(start, end),
    },
    { milestone: "Machine collected, web form data delivered", owner: "Bright.Blue", target: end ? formatDayTarget(addDays(end, 1)) : "Day after" },
  ];

  return {
    intro: start
      ? "The timeline below works backwards from the event to ensure everything is tested, produced, and ready."
      : "Once dates are locked, this timeline works backwards from the event so everything is tested, produced, and ready.",
    milestones,
    note: "The sooner we lock in the direction on the creative call, the more polish we can put into the final product.",
  };
}

/** Format pence as a clean GBP headline (e.g. "£10,000"). */
function formatPriceLabel(pence?: number | null): string {
  if (pence == null || pence <= 0) return "";
  const pounds = pence / 100;
  return `\u00a3${pounds.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export function generateProposalContent(input: ProposalGenerateInput): ProposalContent {
  const start = parseDate(input.eventDateStart);
  const end = parseDate(input.eventDateEnd);
  const days = durationDays(start, end);
  const now = new Date();

  const device = (input.machinePreference?.trim() || "Experience Portal").replace(/\s+/g, " ");
  const company = input.companyName?.trim() || null;
  const nar = objectiveNarrative(input.objective);

  const selected = getCapabilities(input.addons ?? []);

  // What's-included: the always-on deliverables plus any selected add-ons.
  const weDeliver = [
    { title: `${device} device`, detail: "Touchscreen device, configured and tested for your giveaway products." },
    { title: "Custom wrap", detail: "Full exterior wrap designed and produced in your branding." },
    { title: "Game implementation", detail: "Branded tap-to-play game with high-score leaderboard, built by our creative team." },
    { title: "Screen content", detail: "Idle-screen video setup and content integration." },
    { title: "Web form", detail: "Custom data-capture form, branded and configured to your questions." },
    { title: "Logistics", detail: "Delivery to venue, setup, and collection post-event." },
    { title: "On-site support", detail: `Bright.Blue team member on-site across all ${days === 1 ? "" : `${days} `}event day${days === 1 ? "" : "s"} for setup, training, and machine management.` },
    { title: "Product testing", detail: "Your giveaway items shipped to us in advance, tested and configured for smooth dispensing." },
    // Tailorable add-ons the customer chose become explicit deliverables.
    ...selected.map((c) => ({ title: c.outcome, detail: c.capability })),
  ];

  const youProvide = [
    { title: "Creative assets", detail: "Brand toolkit, logos, colours, and campaign visuals for the wrap and game." },
    { title: "Giveaway products", detail: "Branded merch shipped to Bright.Blue HQ (Milton Keynes) for testing." },
    { title: "Idle screen video", detail: "Brand/campaign video content for the idle-screen loop (or built collaboratively)." },
  ];

  const investmentRows = weDeliver.map((d) => ({ label: d.title, status: "Included" }));

  const timeline = buildTimeline(start, end);

  const qualifying =
    input.qualifyingQuestions?.trim() ||
    "Name plus 1\u20132 qualifying questions (e.g. current priorities, product interest) that give your team context for follow-up.";

  const briefIntro = company
    ? `${company} needs an interactive centrepiece that drives footfall, reinforces the brand narrative, and makes ${company} the most talked-about presence in the room.`
    : "You need an interactive centrepiece that drives footfall, reinforces your brand narrative, and makes you the most talked-about presence in the room.";

  return {
    schemaVersion: PROPOSAL_SCHEMA_VERSION,
    cover: {
      title: company ? `${company} Activation` : "Your Bright.Blue Activation",
      subtitle: `Interactive brand experience \u00b7 ${formatRange(start, end)}`,
      durationLabel: `${days} day${days === 1 ? "" : "s"}`,
      deviceLabel: `1 ${device}`,
      managedLabel: "Turnkey \u00b7 Fully managed",
      stamp: `${MONTHS[now.getMonth()]} ${now.getFullYear()} \u00b7 Confidential`,
    },
    brief: {
      heading: nar.heading,
      intro: briefIntro,
      challenge: input.briefChallenge?.trim() || nar.challenge,
      success: input.briefSuccess?.trim() || nar.success,
    },
    solution: {
      heading: `Gamified brand activation on the ${device}`,
      intro: `A fully branded, interactive ${device} on your stand. Attendees play, compete, share details, and collect prizes. Every touchpoint tells your story \u2014 from the machine wrap to the game to the idle-screen video running between interactions.`,
      experienceTitle: "The cascade effect",
      experienceBody:
        "One person playing catches the attention of two more walking past. They see a prize being dispensed. They queue up. High scores create competition \u2014 people come back with colleagues to beat their score. This is how you build sustained booth traffic.",
      steps: STANDARD_STEPS,
    },
    creative: {
      heading: "Your brand, A to Z",
      intro:
        "Every element of the activation is built around your brand identity. The machine will look, feel, and play like it was built by your team.",
      items: [
        {
          title: "Machine wrap",
          body: "Full exterior wrap in your creative \u2014 messaging, brand colours, and campaign visuals. The machine becomes a branded installation, not a generic unit.",
        },
        {
          title: "Idle screen video",
          body: "When nobody is playing, the screen runs a looping video. This is where you tell your story: new products, innovation highlights, brand narrative. Content supplied by your team or built collaboratively.",
        },
        {
          title: "Game design",
          body: "The tap-to-play game is fully branded: your colours, logos, and themed icons and assets. Our creative team handles the build \u2014 your team supplies assets via a Figma brief.",
        },
        {
          title: "Web form",
          body: "The post-game data-capture form is light-touch: name plus 1\u20132 qualifying questions. Business email is valuable but not required, keeping the experience non-invasive and fun.",
        },
      ],
      processNote:
        "After agreement, Bright.Blue schedules a creative call with your brand and design team. We outline what assets are needed, your team supplies them, and our team builds the wrap, game, and screen content. If you'd prefer Bright.Blue to handle creative end to end, that can be arranged as an additional service.",
    },
    data: {
      heading: "Qualified data without the friction",
      intro:
        "The machine captures qualified, contextual data from attendees who actively engaged with your stand.",
      rows: [
        {
          source: "Machine web form",
          whatYouGet: qualifying,
          how: "QR code after gameplay opens a branded form on the attendee's phone.",
        },
        {
          source: "Engagement metrics",
          whatYouGet: "Plays, interactions, dwell, and lead volume across the event.",
          how: "Live engagement dashboard, included with every activation.",
        },
      ],
      value:
        "Instead of a flat list, your sales team gets a shortlist of people who actively engaged \u2014 with specific context about their priorities. That turns a cold follow-up into a warm conversation.",
    },
    included: {
      heading: "Turnkey activation package",
      intro:
        "One fee. Everything managed. You provide creative assets and giveaway items. Bright.Blue handles the rest.",
      weDeliver,
      youProvide,
    },
    investment: {
      heading: "One fee, everything included",
      priceLabel: formatPriceLabel(input.totalPence),
      priceCaption: "Turnkey activation fee",
      durationLabel: `${days} day${days === 1 ? "" : "s"}${start ? ` \u00b7 ${formatRange(start, end)}` : ""}`,
      allInLabel: "All-in \u00b7 no additional costs",
      rows: investmentRows,
      note:
        "If you'd like Bright.Blue to handle creative design end to end (rather than supplying assets), custom design work is available as an additional service and scoped separately. Giveaway products are supplied by you.",
    },
    timeline: {
      heading: start ? "Working backwards from your event" : "From go-ahead to go-live",
      intro: timeline.intro,
      milestones: timeline.milestones,
      note: timeline.note,
    },
    nextSteps: {
      heading: "Getting started",
      actions: [
        { action: "Run through this proposal together on a 15-minute walkthrough call.", owner: `${input.contactName?.trim() || "You"} + Bright.Blue` },
        { action: "Confirm the game concept and creative direction.", owner: "Both" },
        { action: "Creative call with your brand and design team to brief assets.", owner: "Both" },
        { action: "Ship giveaway product samples to Bright.Blue HQ for testing.", owner: "You" },
        { action: "Activation goes live.", owner: "Both" },
      ],
      note:
        "The key constraint is the creative and production timeline \u2014 the sooner we lock in the direction, the more polish we can put into the final product. No idea is too creative to explore; bespoke experiences are scoped separately.",
    },
  };
}

/** Mention the always-on capabilities (for a "what's always included" strip). */
export function alwaysOnOutcomes(): string[] {
  return ALWAYS_ON.map((c) => c.outcome);
}
