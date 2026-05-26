/**
 * Tests for the creative briefing schema.
 */

import { describe, it, expect } from "vitest";
import { briefingFormSchema } from "./briefing";

const validBriefing = {
  brandName: "Acme",
  campaignObjective: "Drive footfall to the booth and capture qualified leads",
};

describe("briefingFormSchema", () => {
  it("accepts a valid minimal briefing", () => {
    expect(() => briefingFormSchema.parse(validBriefing)).not.toThrow();
  });

  it("accepts a briefing with every optional field", () => {
    expect(() =>
      briefingFormSchema.parse({
        ...validBriefing,
        targetAudience: "B2B marketers",
        keyMessages: "Speed, simplicity",
        brandGuidelines: "https://example/guidelines.pdf",
        colorPreferences: "Navy, gold",
        inspirationLinks: "https://example/moodboard",
        additionalNotes: "Anything goes",
      })
    ).not.toThrow();
  });

  it("rejects an empty brand name", () => {
    expect(() =>
      briefingFormSchema.parse({ ...validBriefing, brandName: "" })
    ).toThrow(/Brand name is required/);
  });

  it("rejects a very short campaign objective", () => {
    expect(() =>
      briefingFormSchema.parse({ ...validBriefing, campaignObjective: "short" })
    ).toThrow(/describe the campaign objective/i);
  });
});
