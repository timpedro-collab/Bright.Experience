/**
 * Instant estimate shown the moment an intake is submitted — before any human
 * touches the quote (the Hire Space "answer in seconds" pattern, docs/19).
 *
 * Combines two things we already know at submit time: which commercial tier
 * the chosen capabilities imply (docs/20 fences), and what comparable
 * activations have actually done (fleet benchmarks via
 * `buildExpectation`). Returns ranges only, never a single confident number,
 * and omits any metric we have no basis for.
 */
import {
  getTier,
  formatTierBand,
  type PricingTier,
  type TierSlug,
} from "@/lib/pricing/tiers";
import {
  buildExpectation,
  type BenchmarkInput,
  type Expectation,
} from "@/lib/metrics/expected-performance";

export interface InstantEstimate {
  tierSlug: TierSlug;
  tierName: string;
  /** UK band for the implied tier, e.g. "£16,000–£24,000". */
  bandLabel: string;
  plays: Expectation | null;
  /** Only present when the implied tier includes the lead-capture layer. */
  leads: Expectation | null;
}

/**
 * The commercial tier a capability selection implies, per the docs/20
 * fences: live telemetry → Command, lead capture → Lead Engine, else the
 * base tier. Bespoke is never implied by an intake — it is a conversation.
 */
export function tierForAddons(addons: ReadonlyArray<string>): PricingTier {
  if (addons.includes("live-telemetry")) return getTier("command")!;
  if (addons.includes("lead-capture")) return getTier("lead-engine")!;
  return getTier("showstopper")!;
}

export interface InstantEstimateInput {
  addons: ReadonlyArray<string>;
  eventType?: string | null;
  machineType?: string | null;
  /** Days on the floor; defaults to a single day. */
  days?: number;
  benchmarks: BenchmarkInput[];
}

/** Build the instant estimate. Pure; serializable for server-action returns. */
export function buildInstantEstimate(input: InstantEstimateInput): InstantEstimate {
  const tier = tierForAddons(input.addons);
  const shared = {
    eventType: input.eventType,
    machineType: input.machineType,
    days: input.days ?? 1,
  };

  const includesLeadCapture =
    tier.includedCapabilitySlugs.includes("lead-capture");

  return {
    tierSlug: tier.slug,
    tierName: tier.displayName,
    bandLabel: formatTierBand(tier, "uk"),
    plays: buildExpectation(input.benchmarks, { metric: "plays", ...shared }),
    leads: includesLeadCapture
      ? buildExpectation(input.benchmarks, { metric: "leads", ...shared })
      : null,
  };
}
