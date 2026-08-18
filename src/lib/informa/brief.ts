/**
 * Deal brief formatter for the Informa seller's kit.
 *
 * The rep fills the brief builder during the closing conversation; this
 * module turns that form state into the plain-text delivery brief that goes
 * to Bright.Blue. Only answered fields appear, so a half-filled brief still
 * reads cleanly instead of shipping a page of blanks.
 *
 * Pure module: strings in, string out. The component owns the form state.
 */

export interface DealBriefInput {
  showName?: string;
  showDates?: string;
  placement?: string;
  sponsorCompany?: string;
  sponsorContact?: string;
  sponsorEmail?: string;
  /** Labels of the objectives the sponsor picked. */
  objectives?: string[];
  dispense?: string;
  creativeNotes?: string;
  complianceNotes?: string;
  agreedPrice?: string;
  repName?: string;
}

/** The objective choices the brief builder offers. */
export const BRIEF_OBJECTIVES = [
  "Capture leads",
  "Sample product",
  "Brand awareness",
  "Launch something new",
  "Drive rebooking",
] as const;

interface BriefLine {
  label: string;
  value: string;
}

const trimmed = (v: string | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

/** The ordered label/value lines of the brief, answered fields only. */
export function briefLines(input: DealBriefInput): BriefLine[] {
  const lines: BriefLine[] = [];
  const push = (label: string, value: string | null) => {
    if (value) lines.push({ label, value });
  };

  push("Show", trimmed(input.showName));
  push("Dates", trimmed(input.showDates));
  push("Placement", trimmed(input.placement));
  push("Sponsor", trimmed(input.sponsorCompany));
  push("Contact", trimmed(input.sponsorContact));
  push("Contact email", trimmed(input.sponsorEmail));
  if (input.objectives && input.objectives.length > 0) {
    lines.push({ label: "Objectives", value: input.objectives.join(", ") });
  }
  push("Sampling / prizes", trimmed(input.dispense));
  push("Creative notes", trimmed(input.creativeNotes));
  push("Compliance notes", trimmed(input.complianceNotes));
  push("Agreed price", trimmed(input.agreedPrice));
  push("Registered by", trimmed(input.repName));
  return lines;
}

/**
 * The full plain-text brief, ready for the clipboard or an email body.
 * Returns null when nothing has been filled in, so the UI can keep the
 * send affordances disabled instead of shipping an empty brief.
 */
export function buildBriefText(input: DealBriefInput): string | null {
  const lines = briefLines(input);
  if (lines.length === 0) return null;
  return [
    "New activation deal brief — via the Informa seller's kit",
    "",
    ...lines.map((l) => `${l.label}: ${l.value}`),
    "",
    "Next step: Bright.Blue confirms availability and pricing within 24 hours; the registered deal holds 14 days of exclusivity.",
  ].join("\n");
}

/** Subject line for the mailto handoff. */
export function briefSubject(input: DealBriefInput): string {
  const sponsor = trimmed(input.sponsorCompany);
  const show = trimmed(input.showName);
  if (sponsor && show) return `Deal brief: ${sponsor} at ${show}`;
  if (sponsor) return `Deal brief: ${sponsor}`;
  if (show) return `Deal brief: ${show}`;
  return "Deal brief from the Informa seller's kit";
}
