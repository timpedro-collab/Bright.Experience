import { describe, expect, it } from "vitest";

import { buildProposalDocument, type ProposalQuoteInput } from "./build-proposal";

const baseQuote: ProposalQuoteInput = {
  id: "q-1",
  company_name: "Acme",
  event_type: "tradeshow",
  objective: "lead-generation",
  machine_preference: "Experience Portal",
  event_date_start: "2026-10-03",
  event_date_end: "2026-10-05",
  total_amount: 1_250_000,
};

describe("buildProposalDocument pathways", () => {
  it("recommends the proposed config and offers a one-day pilot for multi-day events", () => {
    const doc = buildProposalDocument(baseQuote);
    expect(doc.pathways.recommended.tag).toBe("Our recommendation");
    expect(doc.pathways.recommended.title).toContain("3 days");
    expect(doc.pathways.alternative.title).toMatch(/one-day pilot/i);
  });

  it("offers a second live day as the alternative for single-day events", () => {
    const doc = buildProposalDocument({
      ...baseQuote,
      event_date_start: "2026-10-03",
      event_date_end: "2026-10-03",
    });
    expect(doc.pathways.recommended.title).toContain("1 day,");
    expect(doc.pathways.alternative.title).toMatch(/second live day/i);
  });

  it("always produces exactly one recommendation and one alternative", () => {
    const doc = buildProposalDocument({ ...baseQuote, event_date_start: null, event_date_end: null });
    expect(doc.pathways.recommended.body.length).toBeGreaterThan(0);
    expect(doc.pathways.alternative.body.length).toBeGreaterThan(0);
  });
});
