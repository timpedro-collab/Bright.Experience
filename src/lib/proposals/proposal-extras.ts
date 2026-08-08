/**
 * Proposal microsite extras — endowed progress, per-role anchors, and the
 * "how we de-risk this" content.
 *
 * Pure module (no DB, no React) so the proposal page, the champion one-pager
 * and the PDF pipeline can all share the exact same content and state logic.
 */

import { DEFAULT_ACCOUNT_MANAGER, type TeamPersona } from "@/lib/team";

/* -------------------------------------------------------------------------
 * Endowed progress — "Step 2 of 4, built from your brief"
 * ---------------------------------------------------------------------- */

export type JourneyStepState = "done" | "current" | "upcoming";

export interface JourneyStep {
  label: string;
  state: JourneyStepState;
}

export interface ProposalJourney {
  steps: JourneyStep[];
  /** e.g. "Step 2 of 4 · built from your brief" */
  caption: string;
}

interface JourneyInput {
  status?: string | null;
  walkthrough_completed_at?: string | null;
}

/**
 * Where this buyer is on the four-step path from brief to booked.
 *
 * The first two steps are always already complete when a proposal exists —
 * that's the endowed progress: the reader arrives halfway, not at zero.
 */
export function buildProposalJourney(quote: JourneyInput): ProposalJourney {
  const labels = ["Your brief", "Your proposal", "Walkthrough", "Booked"];

  if (quote.status === "accepted") {
    return {
      steps: labels.map((label) => ({ label, state: "done" })),
      caption: "All four steps done · your event workspace is being set up",
    };
  }

  if (quote.walkthrough_completed_at) {
    return {
      steps: [
        { label: labels[0], state: "done" },
        { label: labels[1], state: "done" },
        { label: labels[2], state: "done" },
        { label: labels[3], state: "current" },
      ],
      caption: "Step 3 of 4 complete · your price is unlocked below",
    };
  }

  return {
    steps: [
      { label: labels[0], state: "done" },
      { label: labels[1], state: "current" },
      { label: labels[2], state: "upcoming" },
      { label: labels[3], state: "upcoming" },
    ],
    caption: "Step 2 of 4 · built from your brief answers, not a template",
  };
}

/* -------------------------------------------------------------------------
 * Per-role anchors — route each stakeholder to the section they care about
 * ---------------------------------------------------------------------- */

export interface RoleAnchor {
  /** Who this card addresses ("Your finance lead"). */
  role: string;
  /** What they'll find at the anchor. */
  body: string;
  /** In-page anchor (e.g. "#investment"). */
  href: string;
  /** Link label ("Jump to investment"). */
  label: string;
}

/** The three stakeholders who typically weigh in on an activation sign-off. */
export const ROLE_ANCHORS: RoleAnchor[] = [
  {
    role: "Your finance lead",
    body: "One all-in fee, what it covers line by line, and no extras hiding in the small print.",
    href: "#investment",
    label: "Jump to investment",
  },
  {
    role: "Your brand lead",
    body: "How the wrap, the game and the screen content carry the brand end to end.",
    href: "#creative",
    label: "Jump to creative",
  },
  {
    role: "Your ops lead",
    body: "Who does what and when — every date worked backwards from the event, delivery to collection.",
    href: "#timeline",
    label: "Jump to timeline",
  },
];

/* -------------------------------------------------------------------------
 * How we de-risk this — named lead, SLA, bounded worst case
 * ---------------------------------------------------------------------- */

export interface DeRiskItem {
  title: string;
  body: string;
}

/**
 * The three commitments that bound the buyer's downside. Written as promises
 * the delivery team actually keeps — a named owner, response times in
 * writing, and a worst case with a hard edge.
 */
export function buildDeRiskItems(
  persona: TeamPersona = DEFAULT_ACCOUNT_MANAGER,
): DeRiskItem[] {
  return [
    {
      title: `One named owner: ${persona.fullName}`,
      body: `${persona.firstName} (${persona.title}) runs your activation end to end — same person on the walkthrough, the creative call, and the phone on event day. Reach them directly at ${persona.email}.`,
    },
    {
      title: "Response times in writing",
      body: "Every question answered within one business day in the run-up, and a Bright.Blue team member on site across every live day — you never chase a ticket queue.",
    },
    {
      title: "The worst case, bounded",
      body: "Your machine is wrapped, product-tested and dry-run a week before the event. If a fault on the day can't be fixed within an hour, that day's hire is free. That's the floor — in writing.",
    },
  ];
}
