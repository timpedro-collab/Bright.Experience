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
  {
    question: "Anything regulated or industry-specific?",
    multi: false,
    hint: "We use this to switch on age-gating and compliance defaults — no surprises later.",
    options: [
      {
        label: "Nothing specific",
        value: "general",
        icon: "✨",
        description: "Standard FMCG, retail, tech, lifestyle.",
      },
      {
        label: "Alcohol",
        value: "alcohol",
        icon: "🥂",
        description: "Beer, wine, spirits — age verification on.",
      },
      {
        label: "Tobacco / vape",
        value: "tobacco",
        icon: "🌬️",
        description: "Compliance-heavy. Age + creative review.",
      },
      {
        label: "Gambling / betting",
        value: "gambling",
        icon: "🎰",
        description: "Regulated promo, age-gated.",
      },
      {
        label: "Financial services",
        value: "financial",
        icon: "🏦",
        description: "FCA-aware copy and disclosures.",
      },
      {
        label: "Healthcare / pharma",
        value: "healthcare",
        icon: "🩺",
        description: "Medical compliance + extra creative review.",
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
 * Selects a machine + package pairing based on the primary objective and
 * space, then asks `preSelectCapabilities` for the 3–5 outcome chips the
 * match card should show as already-included.
 *
 * Slug contract: the machine/package slugs returned here MUST exist in
 * `supabase/seed.sql`. If you add a new machine or rename a package,
 * update the mapping here in the same PR.
 */
export function getRecommendation(
  answers: Record<number, string[]>
): QuizRecommendation {
  const objectives = answers[0] ?? [];
  const eventType = answers[1]?.[0] ?? null;
  const footfall = answers[2]?.[0] ?? null;
  const spaces = answers[3] ?? [];
  const audience = answers[4]?.[0] ?? null;
  const industryAnswer = answers[5]?.[0] ?? null;

  const wantsLeads = objectives.includes("lead-generation");
  const wantsSampling = objectives.includes("sampling");
  const wantsAwareness = objectives.includes("brand-awareness");
  const wantsEntertainment =
    objectives.includes("entertainment") ||
    objectives.includes("employee-engagement");
  const isLargeCrowd =
    footfall === "2000-5000" || footfall === "5000-plus";
  const isOpenSpace =
    spaces.includes("open-space") || spaces.includes("stage-area");

  let match: QuizMatch;

  if (wantsSampling) {
    // Sampling moments are the bread and butter of the Vend family.
    match = isLargeCrowd
      ? {
          machineSlug: "bright-vend-pro",
          packageSlug: "bright-vend-pro-weekend",
          machineName: "Bright.Vend Pro",
          packageName: "Weekend",
        }
      : {
          machineSlug: "bright-vend",
          packageSlug: "bright-vend-single-day",
          machineName: "Bright.Vend",
          packageName: "Single day",
        };
  } else if (wantsLeads || wantsAwareness || wantsEntertainment) {
    // Lead, awareness and entertainment plays all land best on Bright.Play
    // — the big interactive cabinet. Pick the right package for the scale.
    const tourScale = isLargeCrowd && isOpenSpace;
    match = tourScale
      ? {
          machineSlug: "bright-play",
          packageSlug: "bright-play-tour",
          machineName: "Bright.Play",
          packageName: "Tour edition",
        }
      : {
          machineSlug: "bright-play",
          packageSlug: "bright-play-five-day",
          machineName: "Bright.Play",
          packageName: "Five-day activation",
        };
  } else {
    // No strong signal — bespoke discovery call so the AE can shape it.
    match = {
      machineSlug: "bright-play",
      packageSlug: "bespoke",
      machineName: "Bright.Play",
      packageName: "Bespoke",
    };
  }

  const industry =
    industryAnswer && industryAnswer !== "general" ? industryAnswer : null;

  // The pre-select predicates handle one objective at a time, so we union
  // the hits across every selected objective. Audience and event type are
  // single-pick so a single signals bundle is enough — we feed `null`
  // through for the others and merge results.
  const baseSignals: QuizSignals = {
    objective: null,
    eventType,
    audience,
    industry,
  };
  const seen = new Set<string>();
  if (objectives.length === 0) {
    for (const slug of preSelectCapabilities(baseSignals)) seen.add(slug);
  } else {
    for (const objective of objectives) {
      for (const slug of preSelectCapabilities({
        ...baseSignals,
        objective,
      })) {
        seen.add(slug);
      }
    }
  }
  // Cap to 5 to keep the match card calm — order by canonical catalogue.
  const preSelected = Array.from(seen).slice(0, 5);

  const primarySignals: QuizSignals = {
    objective: objectives[0] ?? null,
    eventType,
    audience,
    industry,
  };

  return {
    match,
    preSelectedCapabilities: preSelected,
    signals: primarySignals,
  };
}
