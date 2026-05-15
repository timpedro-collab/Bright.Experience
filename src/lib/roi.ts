/** ROI math shared by ProposalROIPanel and the legacy ROICalculator.
 *
 * Two flavours of ROI live in the product:
 *
 *  1. {@link computeProspectROI} — used in the catalog ROI calculator where
 *     the user nudges expected attendees / conversion rate / lead value.
 *     There is no price yet, so it returns absolute revenue rather than a
 *     ratio.
 *
 *  2. {@link computeProposalROI} — used in the proposal ROI panel once a
 *     quote total is known. It returns revenue, ROI multiple, and payback
 *     months relative to the investment.
 */

/** Default mean lead value (£) by event audience. */
export const DEFAULT_LEAD_VALUE: Record<"b2c" | "b2b" | "mixed", number> = {
  b2c: 50,
  b2b: 400,
  mixed: 120,
};

/** Heuristic ratio of interactions per attendee. Backed by benchmark data. */
export const INTERACTION_RATE = 0.45;

/** Default conversion rate (% of interactions becoming leads). */
export const DEFAULT_CONVERSION_RATE = 15;

export interface ProspectROIInputs {
  attendees: number;
  /** Whole-number percentage, e.g. 15 means 15% */
  conversionRate: number;
  /** £ per lead */
  leadValue: number;
}

export interface ProspectROIResult {
  interactions: number;
  leads: number;
  revenue: number;
}

/** Catalog-style estimate: no investment input, just revenue. */
export function computeProspectROI(input: ProspectROIInputs): ProspectROIResult {
  const interactions = Math.round(input.attendees * INTERACTION_RATE);
  const leads = Math.round(interactions * (input.conversionRate / 100));
  const revenue = Math.round(leads * input.leadValue);
  return { interactions, leads, revenue };
}

export interface ProposalROIInputs {
  /** Estimated number of leads from the proposal */
  estimatedLeads: number;
  /** Average lead value in £ */
  leadValue: number;
  /** Investment in pence (so it matches quote.total_amount) */
  investmentPence: number;
}

export interface ProposalROIResult {
  /** Revenue in £ (NOT pence) */
  revenue: number;
  /** Investment in £ (converted from pence for convenience) */
  investment: number;
  /** Return on investment as a multiple, e.g. 4.2 means "4.2× back" */
  roiMultiple: number;
  /** Payback period in months, assuming a 12-month payback horizon */
  paybackMonths: number;
}

/** Proposal-style ROI — needs both leads and quote price. */
export function computeProposalROI(input: ProposalROIInputs): ProposalROIResult {
  const investment = input.investmentPence / 100;
  const revenue = Math.round(input.estimatedLeads * input.leadValue);
  const roiMultiple = investment > 0 ? revenue / investment : 0;
  const paybackMonths =
    revenue > 0 ? Math.max(0.1, Math.min(36, 12 / Math.max(0.0001, roiMultiple))) : Infinity;
  return { revenue, investment, roiMultiple, paybackMonths };
}

/** Pick a sensible default lead value from an event_type string. */
export function defaultLeadValueForEventType(
  eventType: string | null | undefined
): number {
  const normalised = (eventType ?? "").toLowerCase();
  if (
    normalised.includes("trade") ||
    normalised.includes("b2b") ||
    normalised.includes("conference") ||
    normalised.includes("exhibition")
  ) {
    return DEFAULT_LEAD_VALUE.b2b;
  }
  if (
    normalised.includes("consumer") ||
    normalised.includes("b2c") ||
    normalised.includes("activation") ||
    normalised.includes("shopper") ||
    normalised.includes("retail") ||
    normalised.includes("festival") ||
    normalised.includes("public")
  ) {
    return DEFAULT_LEAD_VALUE.b2c;
  }
  return DEFAULT_LEAD_VALUE.mixed;
}

/** Format £ with locale grouping, no decimals. */
export function formatGBP(amount: number): string {
  return `£${Math.round(amount).toLocaleString("en-GB")}`;
}
