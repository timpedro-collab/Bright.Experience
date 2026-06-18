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
        icon: "megaphone",
        description: "Eyes on the brand. Dwell time, share-worthy moments.",
      },
      {
        label: "Capture leads",
        value: "lead-generation",
        icon: "target",
        description: "Collect opted-in contacts and first-party data from every play.",
      },
      {
        label: "Put product in hands",
        value: "sampling",
        icon: "gift",
        description: "Win-to-unlock sampling that earns its sticker price.",
      },
      {
        label: "Gather insight",
        value: "research",
        icon: "lightbulb",
        description: "Survey and qualifying questions built into play — so sales follow up with context, not just a name and email.",
      },
      {
        label: "Launch something new",
        value: "product-launch",
        icon: "rocket",
        description: "Put a new product or campaign in the spotlight with a moment that lands.",
      },
      {
        label: "Grow our following",
        value: "social",
        icon: "share-2",
        description: "Follow-to-unlock and social gates that turn plays into new followers.",
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
        icon: "building-2",
        description: "Fast hook plus lead capture for focused industry buyers.",
      },
      {
        label: "Exhibition",
        value: "exhibition",
        icon: "tent",
        description: "Deeper browse and storytelling for mixed audiences.",
      },
      {
        label: "Experiential activation",
        value: "experiential-activation",
        icon: "sparkles",
        description: "An out-of-home brand moment in a high-footfall public space.",
      },
      {
        label: "Festival",
        value: "festival",
        icon: "music",
        description: "Outdoor, high-energy crowds with peak attention windows.",
      },
      {
        label: "Corporate",
        value: "corporate",
        icon: "briefcase",
        description: "Internal teams or VIP clients — bespoke branded delight.",
      },
      {
        label: "Conference",
        value: "conference",
        icon: "mic",
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
        icon: "user",
        description: "Intimate audience — every interaction counts.",
      },
      {
        label: "500–2,000",
        value: "500-2000",
        icon: "users",
        description: "Balanced footfall — one activation handles the flow.",
      },
      {
        label: "2,000–5,000",
        value: "2000-5000",
        icon: "users-round",
        description: "High volume — consider express play modes.",
      },
      {
        label: "5,000+",
        value: "5000-plus",
        icon: "stadium",
        description: "Crowd scale — queue management or multiple stations.",
      },
    ],
  },
  {
    question: "What's your footprint?",
    multi: false,
    options: [
      { label: "Small booth", value: "small-booth", icon: "ruler" },
      { label: "Large booth", value: "large-booth", icon: "warehouse" },
      { label: "Open space", value: "open-space", icon: "globe" },
      { label: "Stage area", value: "stage-area", icon: "theater" },
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
        icon: "handshake",
        description: "Decision-makers, procurement, partner crowds.",
      },
      {
        label: "Consumers",
        value: "B2C",
        icon: "shopping-bag",
        description: "The public — friends, families, shoppers, fans.",
      },
      {
        label: "A bit of both",
        value: "mixed",
        icon: "circle-dot",
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
        icon: "sparkles",
        description: "Standard FMCG, retail, tech, lifestyle.",
      },
      {
        label: "Alcohol",
        value: "alcohol",
        icon: "wine",
        description: "Beer, wine, spirits — age verification on.",
      },
      {
        label: "Tobacco / vape",
        value: "tobacco",
        icon: "wind",
        description: "Compliance-heavy. Age + creative review.",
      },
      {
        label: "Gambling / betting",
        value: "gambling",
        icon: "dice-5",
        description: "Regulated promo, age-gated.",
      },
      {
        label: "Financial services",
        value: "financial",
        icon: "landmark",
        description: "FCA-aware copy and disclosures.",
      },
      {
        label: "Healthcare / pharma",
        value: "healthcare",
        icon: "stethoscope",
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
  /**
   * Every goal the customer picked on the (multi-select) first step, in the
   * order they were chosen. Surfaced back to them on the match card so the
   * experience visibly remembers what they said they wanted.
   */
  goals: string[];
}

/** The customer-facing label for a goal value, as it appeared on step 1. */
export function goalLabel(value: string): string {
  const opt = QUIZ_STEPS[0].options.find((o) => o.value === value);
  return opt?.label ?? value;
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
  const wantsEngagement =
    objectives.includes("research") ||
    objectives.includes("product-launch") ||
    objectives.includes("social");
  const isLargeCrowd =
    footfall === "2000-5000" || footfall === "5000-plus";
  const isOpenSpace =
    spaces.includes("open-space") || spaces.includes("stage-area");

  let match: QuizMatch;

  if (wantsSampling) {
    match = isLargeCrowd
      ? {
          machineSlug: "experience-portal",
          packageSlug: "bright-vend-pro-weekend",
          machineName: "Experience Portal",
          packageName: "Weekend",
        }
      : {
          machineSlug: "experience-portal-compact",
          packageSlug: "bright-vend-single-day",
          machineName: "Experience Portal Compact",
          packageName: "Single day",
        };
  } else if (wantsLeads || wantsAwareness || wantsEngagement) {
    const tourScale = isLargeCrowd && isOpenSpace;
    match = tourScale
      ? {
          machineSlug: "experience-portal-xl",
          packageSlug: "bright-play-tour",
          machineName: "Experience Portal XL",
          packageName: "Tour edition",
        }
      : {
          machineSlug: "experience-portal-xl",
          packageSlug: "bright-play-five-day",
          machineName: "Experience Portal XL",
          packageName: "Five-day activation",
        };
  } else {
    match = {
      machineSlug: "experience-portal-xl",
      packageSlug: "bespoke",
      machineName: "Experience Portal XL",
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
    goals: objectives,
  };
}
