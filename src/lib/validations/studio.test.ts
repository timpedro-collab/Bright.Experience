/**
 * Tests for the Bright.Studio service request schema.
 */

import { describe, it, expect } from "vitest";
import { studioRequestSchema } from "./studio";

const validRequest = {
  serviceType: "design" as const,
  title: "New attract loop",
  description: "Need a 15-second loop for the spring activation",
};

describe("studioRequestSchema", () => {
  it("accepts a valid request", () => {
    expect(() => studioRequestSchema.parse(validRequest)).not.toThrow();
  });

  it("defaults expressTurnaround to false when omitted", () => {
    const parsed = studioRequestSchema.parse(validRequest);
    expect(parsed.expressTurnaround).toBe(false);
  });

  it("accepts express turnaround opt-in", () => {
    const parsed = studioRequestSchema.parse({
      ...validRequest,
      expressTurnaround: true,
    });
    expect(parsed.expressTurnaround).toBe(true);
  });

  it("rejects a short title", () => {
    expect(() =>
      studioRequestSchema.parse({ ...validRequest, title: "ab" })
    ).toThrow(/Title must be at least 3/);
  });

  it("rejects a short description", () => {
    expect(() =>
      studioRequestSchema.parse({ ...validRequest, description: "short" })
    ).toThrow(/detailed description/i);
  });

  it("rejects an unknown service type", () => {
    expect(() =>
      studioRequestSchema.parse({ ...validRequest, serviceType: "magic" })
    ).toThrow();
  });

  it.each([
    "design",
    "animation",
    "video",
    "photography",
    "copywriting",
    "other",
  ] as const)("accepts service type %s", (serviceType) => {
    expect(() =>
      studioRequestSchema.parse({ ...validRequest, serviceType })
    ).not.toThrow();
  });

  it("rejects zero or negative quantity", () => {
    expect(() =>
      studioRequestSchema.parse({ ...validRequest, quantity: 0 })
    ).toThrow();
    expect(() =>
      studioRequestSchema.parse({ ...validRequest, quantity: -1 })
    ).toThrow();
  });
});
