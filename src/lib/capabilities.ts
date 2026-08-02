/**
 * Canonical capability vocabulary for Bright.Experience.
 *
 * Source of truth for the thirteen capabilities (four always-on + nine
 * tailorable) that every customer-facing surface (quiz, match reveal, refine
 * drawer, proposal intake, admin quote view) speaks. The customer never sees
 * the slug — they see the `outcome` line.
 *
 * Editing this file is the **only** place to add or rename a capability. The DB
 * mirrors the slug list via a check constraint on `package_addons.capability_slug`.
 *
 * Rules:
 * - `kind: "always-on"` capabilities are included in every activation; they are
 *   never toggled, never sold, never priced separately. Surface them as
 *   reassurance, not as choices.
 * - `kind: "tailorable"` capabilities are the ones the system pre-selects 3–5 of,
 *   based on the customer's quiz signals. They appear as chips on the match
 *   reveal and as toggles in the refine drawer.
 *
 * Pre-selection is intentionally generous. We default to yes and let the
 * customer remove what doesn't fit (see "Default to yes, let them edit").
 */

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export type CapabilityKind = "always-on" | "tailorable";

export interface QuizSignals {
  objective?: string | null;
  eventType?: string | null;
  audience?: string | null;
  industry?: string | null;
}

export interface Capability {
  slug: string;
  /** What the customer reads on the match card and confirmation screen. */
  outcome: string;
  /** Quiet caption under the outcome line in the refine drawer. */
  mechanism: string;
  /** What bright.blue actually delivers — used for AE handoff context. */
  capability: string;
  kind: CapabilityKind;
  /** Default price in pence. Overridable per package on `package_addons`. */
  defaultPricePence: number;
  /** Pure predicate. Returns true when this capability should be pre-selected. */
  preSelect: (signals: QuizSignals) => boolean;
}

/* ----------------------------------------------------------------------------
 * The catalogue — four always-on + eight tailorable
 * ------------------------------------------------------------------------- */

/**
 * Always-on capabilities. Included in every activation. Never toggled.
 * Surface them on the match reveal as reassurance, not as choices.
 *
 * Note: lead capture / first-party data collection is intentionally NOT here —
 * it is a tailorable, separately-priced capability (see `lead-capture` below).
 */
export const ALWAYS_ON: ReadonlyArray<Pick<Capability, "slug" | "outcome" | "capability">> = [
  {
    slug: "tap-to-play",
    outcome: "Tap-to-play interactive game",
    capability: "Game library and instant-play UX",
  },
  {
    slug: "branded-wrap",
    outcome: "Branded wrap and creative build",
    capability: "In-house design studio",
  },
  {
    slug: "engagement-dashboard",
    outcome: "Engagement metrics dashboard",
    capability: "Post-event reporting",
  },
  {
    slug: "turnkey",
    outcome: "Setup, delivery, install, breakdown — all of it",
    capability: "End-to-end logistics",
  },
] as const;

/**
 * Tailorable capabilities. The system pre-selects 3–5 of these per the
 * customer's quiz signals. The customer can refine in `RefineDrawer`.
 *
 * Ordered roughly by how often they are pre-selected, for a stable layout
 * when several appear together.
 *
 * Adding a slug here? Mirror it in the `package_addons.capability_slug`
 * check constraint with a new migration (see
 * `20260724000001_branded_landing_capability.sql` for the pattern).
 */
export const CAPABILITIES: ReadonlyArray<Capability> = [
  {
    slug: "lead-capture",
    outcome: "Capture opted-in leads on every play",
    mechanism: "GDPR-compliant lead capture form",
    capability: "Compliant first-party data capture",
    kind: "tailorable",
    defaultPricePence: 45_000,
    preSelect: ({ objective, eventType }) =>
      objective === "lead-generation" ||
      objective === "leads" ||
      objective === "research" ||
      eventType === "trade-show" ||
      eventType === "exhibition" ||
      eventType === "conference",
  },
  {
    slug: "live-telemetry",
    outcome: "Your team sees every lead the moment it lands",
    mechanism: "Live brand dashboard",
    capability: "Advanced Telemetry",
    kind: "tailorable",
    defaultPricePence: 75_000,
    preSelect: ({ objective, eventType }) =>
      objective === "lead-generation" ||
      objective === "leads" ||
      eventType === "trade-show" ||
      eventType === "exhibition" ||
      eventType === "conference",
  },
  {
    slug: "sampling-unlock",
    outcome: "Sampling on every win",
    mechanism: "Physical sample dispenses on win",
    capability: "Instant Gratification",
    kind: "tailorable",
    defaultPricePence: 95_000,
    preSelect: ({ objective, eventType }) =>
      objective === "sampling" ||
      objective === "product-launch" ||
      eventType === "festival" ||
      eventType === "experiential-activation",
  },
  {
    slug: "linkedin-follow",
    outcome: "Follow-to-unlock on the prize screen",
    mechanism: "LinkedIn follow gate before reward",
    capability: "Custom Content",
    kind: "tailorable",
    defaultPricePence: 35_000,
    // Opt-in only: shown as a toggle in Refine, never auto-promised.
    preSelect: () => false,
  },
  {
    slug: "survey-layer",
    outcome: "One smart question between rounds",
    mechanism: "Survey or poll layer mid-game",
    capability: "Custom Content",
    kind: "tailorable",
    defaultPricePence: 40_000,
    // Opt-in only: shown as a toggle in Refine, never auto-promised.
    preSelect: () => false,
  },
  {
    slug: "dynamic-sponsors",
    outcome: "Sponsor creative rotates between plays",
    mechanism: "Dynamic ad delivery between rounds",
    capability: "Ad Platform / Dynamic Delivery",
    kind: "tailorable",
    defaultPricePence: 65_000,
    preSelect: ({ eventType, audience }) =>
      eventType === "festival" ||
      eventType === "experiential-activation" ||
      audience === "B2C",
  },
  {
    slug: "age-verification",
    outcome: "Age-gated unlock for alcohol or 18+ products",
    mechanism: "Age verification before play",
    capability: "Age Verification",
    kind: "tailorable",
    defaultPricePence: 55_000,
    // Opt-in only: shown as a toggle in Refine, never auto-promised.
    preSelect: () => false,
  },
  {
    slug: "payments-onunit",
    outcome: "Take payment on the unit",
    mechanism: "On-unit payments terminal",
    capability: "Payments Platform",
    kind: "tailorable",
    defaultPricePence: 120_000,
    // Opt-in only: shown as a toggle in Refine, never auto-promised.
    preSelect: () => false,
  },
  {
    slug: "branded-landing-page",
    outcome: "Sign-up page in your brand, not ours",
    mechanism: "QR capture landing page styled with your brand kit",
    capability: "Branded data-capture landing page",
    kind: "tailorable",
    // Placeholder price — commercial owner to confirm (see OWNER-TODO.md).
    defaultPricePence: 30_000,
    // Opt-in only: shown as a toggle in Refine, never auto-promised.
    preSelect: () => false,
  },
] as const;

/** All tailorable slugs. Used to validate URL params, intake submissions, and the DB check constraint. */
export const UPSELL_SLUGS: ReadonlySet<string> = new Set(
  CAPABILITIES.map((c) => c.slug)
);

/* ----------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */

/** Look up a capability by slug. Returns null for unknown slugs. */
export function getCapability(slug: string): Capability | null {
  return CAPABILITIES.find((c) => c.slug === slug) ?? null;
}

/** Resolve multiple slugs in original catalogue order. Unknown slugs are silently dropped. */
export function getCapabilities(slugs: ReadonlyArray<string>): Capability[] {
  const set = new Set(slugs);
  return CAPABILITIES.filter((c) => set.has(c.slug));
}

/** Filter incoming slugs to the canonical set. Use on every untrusted boundary (URL params, form submissions). */
export function sanitiseCapabilitySlugs(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    if (!UPSELL_SLUGS.has(raw)) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out;
}

/** Apply the pre-selection rules to a quiz signal bundle. Caps the result at 5 to keep the match card calm. */
export function preSelectCapabilities(signals: QuizSignals): string[] {
  const hits = CAPABILITIES.filter((c) => {
    try {
      return c.preSelect(signals);
    } catch {
      return false;
    }
  }).map((c) => c.slug);

  if (hits.length <= 5) return hits;
  return hits.slice(0, 5);
}

/** Encode capability slugs for a URL query param. Stable order; comma-separated. */
export function encodeCapabilityParam(slugs: ReadonlyArray<string>): string {
  return sanitiseCapabilitySlugs([...slugs]).join(",");
}

/** Decode a URL query param into a clean slug array. */
export function decodeCapabilityParam(param: string | null | undefined): string[] {
  if (!param) return [];
  return sanitiseCapabilitySlugs(param.split(","));
}
