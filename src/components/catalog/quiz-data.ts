/**
 * Quiz step definitions for the RecommendationQuiz.
 *
 * Voice notes (bright.blue voice — see plan):
 * - Questions are conversational, not form labels. "Who's coming?" not "Audience type."
 * - Step 1 (objective) is the only multi-select. Every other step is single-click-advance.
 * - The final step is Audience (B2B / B2C / Mixed) — used by `preSelectCapabilities` to
 *   pre-select 3–5 add-ons on the match reveal. The customer never sees the slug.
 *
 * The canonical add-on vocabulary lives in `src/lib/capabilities.ts`. This file
 * carries only the questions and the recommendation routing.
 */

import { preSelectCapabilities, type QuizSignals } from "@/lib/capabilities";

export interface QuizOption {
  label: string;
  value: string;
  icon: string;
  /** Optional short blurb shown beneath the label. Omit for self-evident options. */
  description?: string;
}

export interface QuizStep {
  question: string;
  /**
   * Whether this step allows multiple selections.
   * - `true`  → checkbox-style; user picks any number, advances via Continue button.
   * - `false` → radio-style; clicking auto-advances and replaces any previous pick.
   */
  multi: boolean;
  /** Optional helper copy shown beneath the question. */
  hint?: string;
  options: QuizOption[];
}

export const QUIZ_STEPS: QuizStep[] = [
  {
    question: "What do you want this moment to do?",
    multi: true,
    hint: "Pick everything that matters — most events have more than one ambition.",
    options: [
      {
        label: "Make us memorable",
        value: "brand-awareness",
        icon: "📢",
        description: "Eyes on the brand. Dwell time, share-worthy moments.",
      },
      {
        label: "Build a pipeline",
        value: "lead-generation",
        icon: "🎯",
        description: "Opted-in contacts straight into your CRM.",
      },
      {
        label: "Put product in hands",
        value: "sampling",
        icon: "🎁",
        description: "Win-to-unlock sampling that earns its sticker price.",
      },
      {
        label: "Throw a crowd-pleaser",
        value: "entertainment",
        icon: "🎮",
        description: "Pure delight. Queues that move themselves.",
      },
      {
        label: "Recharge the team",
        value: "employee-engagement",
        icon: "🤝",
        description: "Internal play with branded prizes — morale you can measure.",
      },
    ],
  },
  {
    question: "Where will it live?",
    multi: false,
    options: [
      {
        label: "Trade show",
        value: "trade-show",
        icon: "🏢",
        description: "Fast hook plus lead capture for focused industry buyers.",
      },
      {
        label: "Exhibition",
        value: "exhibition",
        icon: "🎪",
        description: "Deeper browse and storytelling for mixed audiences.",
      },
      {
        label: "Experiential activation",
        value: "experiential-activation",
        icon: "✨",
        description: "An out-of-home brand moment in a high-footfall public space.",
      },
      {
        label: "Festival",
        value: "festival",
        icon: "🎶",
        description: "Outdoor, high-energy crowds with peak attention windows.",
      },
      {
        label: "Corporate",
        value: "corporate",
        icon: "💼",
        description: "Internal teams or VIP clients — bespoke branded delight.",
      },
      {
        label: "Conference",
        value: "conference",
        icon: "🎤",
        description: "Quick filler-moments between sessions and coffee breaks.",
      },
    ],
  },
  {
    question: "How many people are coming?",
    multi: false,
    options: [
      {
        label: "Under 500",
        value: "under-500",
        icon: "👤",
        description: "Intimate audience — every interaction counts.",
      },
      {
        label: "500–2,000",
        value: "500-2000",
        icon: "👥",
        description: "Balanced footfall — one activation handles the flow.",
      },
      {
        label: "2,000–5,000",
        value: "2000-5000",
        icon: "🧑‍🤝‍🧑",
        description: "High volume — consider express play modes.",
      },
      {
        label: "5,000+",
        value: "5000-plus",
        icon: "🏟️",
        description: "Crowd scale — queue management or multiple stations.",
      },
    ],
  },
  {
    question: "What's your footprint?",
    multi: false,
    options: [
      { label: "Small booth", value: "small-booth", icon: "📐" },
      { label: "Large booth", value: "large-booth", icon: "🏗️" },
      { label: "Open space", value: "open-space", icon: "🌐" },
      { label: "Stage area", value: "stage-area", icon: "🎭" },
    ],
  },
  {
    question: "Who's coming?",
    multi: false,
    hint: "Tells us how to layer the experience around them.",
    options: [
      {
        label: "Business buyers",
        value: "B2B",
        icon: "🤝",
        description: "Decision-makers, procurement, partner crowds.",
      },
      {
        label: "Consumers",
        value: "B2C",
        icon: "🛍️",
        description: "The public — friends, families, shoppers, fans.",
      },
      {
        label: "A bit of both",
        value: "mixed",
        icon: "🌗",
        description: "Mixed crowd — we'll balance the layers accordingly.",
      },
    ],
  },
];

/** A single match recommendation: which machine and (optionally) which package. */
export interface QuizMatch {
  /** Machine slug as it appears in the catalog. */
  machineSlug: string;
  /** Optional package slug — used only by the AE for context, never shown to the customer. */
  packageSlug?: string;
  /** Human-readable name of the machine (for fallback when the live catalogue can't be loaded). */
  machineName: string;
  /** Human-readable name of the package paired with it. */
  packageName: string;
}

/** Full quiz result: the matched machine and the canonical capability slugs we'll pre-select. */
export interface QuizRecommendation {
  match: QuizMatch;
  /** Canonical capability slugs from `src/lib/capabilities.ts` to pre-select on the match card. */
  preSelectedCapabilities: string[];
  /** The signals we extracted from the answers — handed to the proposal route so the form is pre-filled. */
  signals: QuizSignals;
}

/**
 * Resolve answers into a recommendation.
 *
 * Selects a machine + package pairing based on the primary objective and space,
 * then asks `preSelectCapabilities` for the 3–5 outcome chips the match card
 * should show as already-included.
 */
export function getRecommendation(
  answers: Record<number, string[]>
): QuizRecommendation {
  const objectives = answers[0] ?? [];
  const eventType = answers[1]?.[0];
  const spaces = answers[3] ?? [];
  const audience = answers[4]?.[0];

  let match: QuizMatch;

  if (objectives.includes("lead-generation")) {
    match = {
      machineSlug: "the-claw",
      packageSlug: "claw-professional",
      machineName: "The Claw",
      packageName: "Professional",
    };
  } else if (
    objectives.includes("brand-awareness") &&
    (spaces.includes("open-space") || spaces.includes("stage-area"))
  ) {
    match = {
      machineSlug: "the-spin",
      packageSlug: "spin-starter",
      machineName: "The Spin",
      packageName: "Starter",
    };
  } else if (
    objectives.includes("entertainment") ||
    objectives.includes("employee-engagement")
  ) {
    match = {
      machineSlug: "the-grab",
      packageSlug: "grab-experience",
      machineName: "The Grab",
      packageName: "Experience",
    };
  } else if (objectives.includes("sampling")) {
    match = {
      machineSlug: "the-claw",
      packageSlug: "claw-professional",
      machineName: "The Claw",
      packageName: "Sampling",
    };
  } else {
    match = {
      machineSlug: "the-claw",
      packageSlug: "claw-starter",
      machineName: "The Claw",
      packageName: "Starter",
    };
  }

  const signals: QuizSignals = {
    objective: objectives[0] ?? null,
    eventType: eventType ?? null,
    audience: audience ?? null,
    industry: null,
  };

  return {
    match,
    preSelectedCapabilities: preSelectCapabilities(signals),
    signals,
  };
}
