/**
 * Quiz step definitions for the RecommendationQuiz.
 *
 * The quiz branches by event *track* after the customer picks an event type:
 *
 *  - Tradeshow / exhibition / conference / corporate → we ask for a concrete
 *    attendee count and derive projected impressions from it.
 *  - Experiential activation / festival → we ask *where* they're activating
 *    (curated high-footfall sites, Waterloo as the hero) and for how many
 *    days, then derive impressions + a DOOH media value from the site's real
 *    footfall.
 *
 * Steps are keyed by a stable `id` (not array index) so the branch can change
 * the visible step list without scrambling stored answers. Each step has a
 * `kind` that tells the UI how to render it.
 *
 * Voice notes (bright.blue voice): questions are conversational, not form
 * labels. Step 1 (objectives) is the only multi-select.
 *
 * The canonical add-on vocabulary lives in `src/lib/capabilities.ts`.
 */

import { preSelectCapabilities, type QuizSignals } from "@/lib/capabilities";
import {
  tradeshowReach,
  type ReachResult,
  type ReachTrack,
} from "@/lib/reach";
import {
  getExperientialLocation,
  reachForLocation,
} from "@/lib/experiential-locations";

export interface QuizOption {
  label: string;
  value: string;
  icon: string;
  /** Optional short blurb shown beneath the label. Omit for self-evident options. */
  description?: string;
}

export type QuizStepKind =
  | "single"
  | "multi"
  | "number"
  | "location"
  | "location-list"
  | "duration";

export interface NumberStepConfig {
  min: number;
  max: number;
  step: number;
  default: number;
  unitSingular: string;
  unitPlural: string;
}

export interface DurationStepConfig {
  min: number;
  max: number;
  default: number;
}

export interface QuizStep {
  /** Stable identifier — answers are keyed by this, not by position. */
  id: string;
  question: string;
  kind: QuizStepKind;
  /** Optional helper copy shown beneath the question. */
  hint?: string;
  /** For `single` / `multi` steps. */
  options?: QuizOption[];
  /** For `number` steps (tradeshow attendees). */
  number?: NumberStepConfig;
  /** For `duration` steps (experiential days on site). */
  duration?: DurationStepConfig;
}

/* -------------------------------------------------------------------------
 * Track classification
 * ---------------------------------------------------------------------- */

const EXPERIENTIAL_EVENT_TYPES = new Set([
  "experiential-activation",
  "festival",
]);

/** Map an event-type answer to the reach track that drives the branch. */
export function trackForEventType(eventType: string | null | undefined): ReachTrack {
  return eventType && EXPERIENTIAL_EVENT_TYPES.has(eventType)
    ? "experiential"
    : "tradeshow";
}

/* -------------------------------------------------------------------------
 * Individual steps
 * ---------------------------------------------------------------------- */

const OBJECTIVES_STEP: QuizStep = {
  id: "objectives",
  question: "What do you want this moment to do?",
  kind: "multi",
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
};

const EVENT_TYPE_STEP: QuizStep = {
  id: "event-type",
  question: "Where will it live?",
  kind: "single",
  hint: "This shapes the rest — tradeshows scale off attendees, activations off location footfall.",
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
};

const ATTENDEES_STEP: QuizStep = {
  id: "attendees",
  question: "How many attendees are expected?",
  kind: "number",
  hint: "Give us your best estimate — we'll project the impressions your stand will earn across the run.",
  number: {
    min: 100,
    max: 60_000,
    step: 100,
    default: 2_500,
    unitSingular: "attendee",
    unitPlural: "attendees",
  },
};

const LOCATION_SOURCE_STEP: QuizStep = {
  id: "location-source",
  question: "Do you already know where you want to activate?",
  kind: "single",
  hint: "Most brands arrive with sites in mind — but if you're still scoping, we'll show you our network.",
  options: [
    {
      label: "I have sites in mind",
      value: "own",
      icon: "map-pin",
      description: "Tell us your shortlist — we'll model the reach around your locations.",
    },
    {
      label: "Show me what's available",
      value: "browse",
      icon: "compass",
      description: "Browse our high-footfall sites and partner spaces, with reach for each.",
    },
  ],
};

const OWN_LOCATIONS_STEP: QuizStep = {
  id: "own-locations",
  question: "Which locations do you have in mind?",
  kind: "location-list",
  hint: "Add each site you're considering — a station, shopping centre, high street, or stadium. We'll model the reach off each site's real footfall on your walkthrough.",
};

const LOCATION_STEP: QuizStep = {
  id: "location",
  question: "Where are you activating?",
  kind: "location",
  hint: "Footfall drives reach — pick the site closest to your plan and we'll model the rest. Our partner network is growing all the time.",
};

const DAYS_STEP: QuizStep = {
  id: "days",
  question: "How many days on site?",
  kind: "duration",
  hint: "Each day multiplies your reach and media value.",
  duration: { min: 1, max: 14, default: 3 },
};

const FOOTPRINT_STEP: QuizStep = {
  id: "footprint",
  question: "What's your footprint?",
  kind: "single",
  options: [
    { label: "Small booth", value: "small-booth", icon: "ruler" },
    { label: "Large booth", value: "large-booth", icon: "warehouse" },
    { label: "Open space", value: "open-space", icon: "globe" },
    { label: "Stage area", value: "stage-area", icon: "theater" },
  ],
};

const AUDIENCE_STEP: QuizStep = {
  id: "audience",
  question: "Who's coming?",
  kind: "single",
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
};

const INDUSTRY_STEP: QuizStep = {
  id: "industry",
  question: "Anything regulated or industry-specific?",
  kind: "single",
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
};

const TIMELINE_STEP: QuizStep = {
  id: "timeline",
  question: "When is it?",
  kind: "single",
  hint: "Helps your event lead prioritise and prep for the walkthrough.",
  options: [
    {
      label: "Within a month",
      value: "within-month",
      icon: "calendar-clock",
      description: "Tight turnaround — we'll move fast.",
    },
    {
      label: "1–3 months",
      value: "1-3-months",
      icon: "calendar",
      description: "Comfortable runway for creative and build.",
    },
    {
      label: "3–6 months",
      value: "3-6-months",
      icon: "calendar-range",
      description: "Plenty of time to get it perfect.",
    },
    {
      label: "Just exploring",
      value: "exploring",
      icon: "compass",
      description: "No fixed date yet — planning ahead.",
    },
  ],
};

/* -------------------------------------------------------------------------
 * Dynamic step assembly (the branch)
 * ---------------------------------------------------------------------- */

export type QuizAnswers = Record<string, string[]>;

/**
 * The ordered list of steps to show, given the answers so far. Until an event
 * type is picked we only know the first two steps; after that the branch
 * (tradeshow vs experiential) fills in the rest.
 */
export function getQuizSteps(answers: QuizAnswers): QuizStep[] {
  const steps: QuizStep[] = [OBJECTIVES_STEP, EVENT_TYPE_STEP];
  const eventType = answers["event-type"]?.[0] ?? null;
  if (!eventType) return steps;

  if (trackForEventType(eventType) === "experiential") {
    // Experiential opens with discovery — how they're choosing locations —
    // which then branches into either their own shortlist or our network.
    steps.push(LOCATION_SOURCE_STEP);
    const source = answers["location-source"]?.[0] ?? null;
    if (!source) return steps;
    steps.push(source === "own" ? OWN_LOCATIONS_STEP : LOCATION_STEP);
    steps.push(DAYS_STEP, AUDIENCE_STEP, INDUSTRY_STEP, TIMELINE_STEP);
  } else {
    steps.push(ATTENDEES_STEP, FOOTPRINT_STEP, AUDIENCE_STEP, INDUSTRY_STEP, TIMELINE_STEP);
  }
  return steps;
}

/* -------------------------------------------------------------------------
 * Recommendation
 * ---------------------------------------------------------------------- */

/** A single match recommendation: which machine and (optionally) which package. */
export interface QuizMatch {
  machineSlug: string;
  packageSlug?: string;
  machineName: string;
  packageName: string;
}

/** Full quiz result: matched machine, capabilities, signals, and projected reach. */
export interface QuizRecommendation {
  match: QuizMatch;
  preSelectedCapabilities: string[];
  signals: QuizSignals;
  goals: string[];
  /** Which track the answers landed in. */
  track: ReachTrack;
  /** Tradeshow attendee count (null on the experiential track). */
  attendees: number | null;
  /** Experiential location key + name (null on the tradeshow track). */
  locationKey: string | null;
  locationName: string | null;
  /** Days on site (experiential). */
  days: number | null;
  /** Rough event timeline answer. */
  timeline: string | null;
  /** Computed projected reach (impressions / interactions / leads [+ DOOH]). */
  reach: ReachResult;
}

const TIMELINE_LABELS: Record<string, string> = {
  "within-month": "Within a month",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  exploring: "Just exploring",
};

/** Customer-facing label for a timeline value. */
export function timelineLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return TIMELINE_LABELS[value] ?? value;
}

/** The customer-facing label for a goal value, as it appeared on the objectives step. */
export function goalLabel(value: string): string {
  const opt = OBJECTIVES_STEP.options?.find((o) => o.value === value);
  return opt?.label ?? value;
}

/**
 * Resolve answers into a recommendation, including projected reach.
 *
 * Slug contract: the machine/package slugs returned here MUST exist in
 * `supabase/seed.sql`.
 */
export function getRecommendation(answers: QuizAnswers): QuizRecommendation {
  const objectives = answers["objectives"] ?? [];
  const eventType = answers["event-type"]?.[0] ?? null;
  const track = trackForEventType(eventType);

  const attendeesRaw = answers["attendees"]?.[0];
  const attendees = attendeesRaw ? Number(attendeesRaw) : null;
  const locationSource = answers["location-source"]?.[0] ?? null;
  const ownLocations = answers["own-locations"] ?? [];
  // Browse track stores a curated key; bring-your-own stores typed site names
  // and is modelled off the generic high-footfall fallback until the call.
  const locationKey =
    locationSource === "own" ? "other" : (answers["location"]?.[0] ?? null);
  const daysRaw = answers["days"]?.[0];
  const days = daysRaw ? Number(daysRaw) : null;
  const footprint = answers["footprint"]?.[0] ?? null;
  const audience = answers["audience"]?.[0] ?? null;
  const industryAnswer = answers["industry"]?.[0] ?? null;
  const timeline = answers["timeline"]?.[0] ?? null;

  // ---- Projected reach ---------------------------------------------------
  let reach: ReachResult;
  let locationName: string | null = null;
  if (track === "experiential") {
    const location = getExperientialLocation(locationKey);
    locationName =
      locationSource === "own" && ownLocations.length > 0
        ? ownLocations.join(", ")
        : location.name;
    reach = reachForLocation(location, days ?? (DAYS_STEP.duration?.default ?? 3));
  } else {
    reach = tradeshowReach({
      attendees: attendees ?? (ATTENDEES_STEP.number?.default ?? 2_500),
    });
  }

  // ---- Machine + package selection --------------------------------------
  const wantsLeads = objectives.includes("lead-generation");
  const wantsSampling = objectives.includes("sampling");
  const wantsAwareness = objectives.includes("brand-awareness");
  const wantsEngagement =
    objectives.includes("research") ||
    objectives.includes("product-launch") ||
    objectives.includes("social");
  const isLargeCrowd =
    track === "experiential" ||
    (attendees != null && attendees >= 2_000);
  const isOpenSpace =
    track === "experiential" ||
    footprint === "open-space" ||
    footprint === "stage-area";

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
      for (const slug of preSelectCapabilities({ ...baseSignals, objective })) {
        seen.add(slug);
      }
    }
  }
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
    track,
    attendees: track === "tradeshow" ? (attendees ?? null) : null,
    locationKey: track === "experiential" ? locationKey : null,
    locationName,
    days: track === "experiential" ? (days ?? null) : null,
    timeline,
    reach,
  };
}
