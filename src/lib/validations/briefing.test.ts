/**
 * Tests for the briefing response schema used by `saveBriefingResponse`.
 */

import { describe, it, expect } from "vitest";
import { briefingResponseSchema, MAX_ANSWER_LENGTH } from "./briefing";

const validResponse = {
  eventId: "e1111111-1111-1111-1111-111111111111",
  formType: "creative" as const,
  responses: { brand_tone: "Playful but premium" },
  submit: false,
};

describe("briefingResponseSchema", () => {
  it("accepts a valid creative briefing draft", () => {
    expect(() => briefingResponseSchema.parse(validResponse)).not.toThrow();
  });

  it("accepts the ops form type", () => {
    expect(() =>
      briefingResponseSchema.parse({ ...validResponse, formType: "ops" })
    ).not.toThrow();
  });

  it("accepts an empty responses record (save-and-resume)", () => {
    expect(() =>
      briefingResponseSchema.parse({ ...validResponse, responses: {} })
    ).not.toThrow();
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      briefingResponseSchema.parse({ ...validResponse, eventId: "evt-1" })
    ).toThrow(/Invalid event ID/);
  });

  it("rejects an unknown form type", () => {
    expect(() =>
      briefingResponseSchema.parse({ ...validResponse, formType: "finance" })
    ).toThrow();
  });

  it("rejects answers over the length cap", () => {
    expect(() =>
      briefingResponseSchema.parse({
        ...validResponse,
        responses: { brand_tone: "x".repeat(MAX_ANSWER_LENGTH + 1) },
      })
    ).toThrow(new RegExp(`under ${MAX_ANSWER_LENGTH}`));
  });

  it("rejects non-string answers", () => {
    expect(() =>
      briefingResponseSchema.parse({
        ...validResponse,
        responses: { brand_tone: 42 },
      })
    ).toThrow();
  });
});
