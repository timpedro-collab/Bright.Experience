/**
 * Behaviour tests for the deterministic demo lead generator.
 */

import { describe, it, expect } from "vitest";
import { generateLeads } from "./generate-leads";

const DEMOGRAPHICS = {
  "18-24": 20,
  "25-34": 35,
  "35-44": 25,
  "45-54": 15,
  "55+": 5,
};

const BASE = {
  eventId: "evt-demo-leads-001",
  count: 100,
  startDate: "2026-06-01",
  days: 3,
  demographics: DEMOGRAPHICS,
};

describe("generateLeads", () => {
  it("returns exactly the requested count", () => {
    const leads = generateLeads(BASE);
    expect(leads).toHaveLength(100);
  });

  it("places every age inside its declared demographic band", () => {
    const leads = generateLeads(BASE);
    const ranges: Record<string, [number, number]> = {
      "18-24": [18, 24],
      "25-34": [25, 34],
      "35-44": [35, 44],
      "45-54": [45, 54],
      "55+": [55, 72],
    };
    for (const lead of leads) {
      const { age, age_band } = lead.custom_fields_json;
      const range = ranges[age_band];
      expect(range).toBeDefined();
      expect(age).toBeGreaterThanOrEqual(range[0]);
      expect(age).toBeLessThanOrEqual(range[1]);
    }
  });

  it("stamps consent at the moment of capture on every lead", () => {
    const leads = generateLeads(BASE);
    for (const lead of leads) {
      expect(lead.consented_at).toBe(lead.captured_at);
    }
  });

  it("is deterministic for the same eventId", () => {
    const a = generateLeads(BASE);
    const b = generateLeads(BASE);
    expect(a).toEqual(b);
  });

  it("diverges when the eventId changes", () => {
    const a = generateLeads(BASE);
    const b = generateLeads({ ...BASE, eventId: "evt-demo-leads-002" });
    expect(a).not.toEqual(b);
  });
});
