/**
 * Structured proposal document model.
 *
 * Mirrors the Bright.Blue sales proposal format (brief → solution → creative
 * → data → included → investment → timeline → next steps). The document is
 * auto-generated from a quote (see `generate.ts`), then editable by the AE,
 * and rendered both on the customer-facing proposal page and the PDF export.
 *
 * Stored as `quotes.proposal_content` (jsonb). Versioned with `schemaVersion`
 * so future shape changes can be migrated safely.
 */

export const PROPOSAL_SCHEMA_VERSION = 1;

export interface ProposalCover {
  title: string;
  subtitle: string;
  /** e.g. "3 days" */
  durationLabel: string;
  /** e.g. "1 Europa device" */
  deviceLabel: string;
  /** e.g. "Turnkey · Fully managed" */
  managedLabel: string;
  /** e.g. "May 2026 · Confidential" */
  stamp: string;
}

export interface ProposalBrief {
  heading: string;
  intro: string;
  challenge: string;
  success: string;
}

export interface ProposalStep {
  label: string;
  body: string;
}

export interface ProposalSolution {
  heading: string;
  intro: string;
  experienceTitle: string;
  experienceBody: string;
  steps: ProposalStep[];
}

export interface ProposalNamedBlock {
  title: string;
  body: string;
}

export interface ProposalCreative {
  heading: string;
  intro: string;
  items: ProposalNamedBlock[];
  processNote: string;
}

export interface ProposalDataRow {
  source: string;
  whatYouGet: string;
  how: string;
}

export interface ProposalData {
  heading: string;
  intro: string;
  rows: ProposalDataRow[];
  value: string;
}

export interface ProposalIncludedItem {
  title: string;
  detail: string;
}

export interface ProposalIncluded {
  heading: string;
  intro: string;
  weDeliver: ProposalIncludedItem[];
  youProvide: ProposalIncludedItem[];
}

export interface ProposalInvestmentRow {
  label: string;
  status: string;
}

export interface ProposalInvestment {
  heading: string;
  /** Headline price, formatted (e.g. "£10,000"). Empty until priced. */
  priceLabel: string;
  priceCaption: string;
  durationLabel: string;
  allInLabel: string;
  rows: ProposalInvestmentRow[];
  note: string;
}

export interface ProposalMilestone {
  milestone: string;
  owner: string;
  target: string;
}

export interface ProposalTimeline {
  heading: string;
  intro: string;
  milestones: ProposalMilestone[];
  note: string;
}

export interface ProposalAction {
  action: string;
  owner: string;
}

export interface ProposalNextSteps {
  heading: string;
  actions: ProposalAction[];
  note: string;
}

export interface ProposalContent {
  schemaVersion: number;
  cover: ProposalCover;
  brief: ProposalBrief;
  solution: ProposalSolution;
  creative: ProposalCreative;
  data: ProposalData;
  included: ProposalIncluded;
  investment: ProposalInvestment;
  timeline: ProposalTimeline;
  nextSteps: ProposalNextSteps;
}

/** Ordered section metadata for rendering the numbered "01 ·" headers. */
export const PROPOSAL_SECTION_ORDER: {
  key: keyof Omit<ProposalContent, "schemaVersion" | "cover">;
  eyebrow: string;
}[] = [
  { key: "brief", eyebrow: "The brief" },
  { key: "solution", eyebrow: "The solution" },
  { key: "creative", eyebrow: "Creative customisation" },
  { key: "data", eyebrow: "Data capture" },
  { key: "included", eyebrow: "What's included" },
  { key: "investment", eyebrow: "Investment" },
  { key: "timeline", eyebrow: "Timeline" },
  { key: "nextSteps", eyebrow: "Next steps" },
];
