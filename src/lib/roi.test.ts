/**
 * Tests for the ROI math powering both the catalog calculator and the
 * proposal ROI panel.
 */

import { describe, it, expect } from "vitest";
import {
  computeProspectROI,
  computeProposalROI,
  defaultLeadValueForEventType,
  formatGBP,
  DEFAULT_LEAD_VALUE,
  INTERACTION_RATE,
  DEFAULT_CONVERSION_RATE,
} from "./roi";

describe("computeProspectROI", () => {
  it("uses INTERACTION_RATE to derive interactions", () => {
    const result = computeProspectROI({
      attendees: 1000,
      conversionRate: 10,
      leadValue: 100,
    });
    // round(1000 * 0.45) = 450
    expect(result.interactions).toBe(Math.round(1000 * INTERACTION_RATE));
    // round(450 * 0.1) = 45
    expect(result.leads).toBe(45);
    expect(result.revenue).toBe(45 * 100);
  });

  it("returns zero revenue for zero attendees", () => {
    expect(
      computeProspectROI({ attendees: 0, conversionRate: 50, leadValue: 100 })
    ).toEqual({ interactions: 0, leads: 0, revenue: 0 });
  });

  it("handles fractional rounding", () => {
    const result = computeProspectROI({
      attendees: 333,
      conversionRate: DEFAULT_CONVERSION_RATE,
      leadValue: 100,
    });
    expect(result.interactions).toBeGreaterThan(0);
    expect(result.leads).toBeGreaterThan(0);
    expect(result.revenue).toBeGreaterThan(0);
  });
});

describe("computeProposalROI", () => {
  it("returns 2× when revenue is double the investment", () => {
    const result = computeProposalROI({
      estimatedLeads: 100,
      leadValue: 200,
      investmentPence: 1_000_000, // £10,000
    });
    expect(result.revenue).toBe(20_000);
    expect(result.investment).toBe(10_000);
    expect(result.roiMultiple).toBe(2);
    expect(result.paybackMonths).toBe(6);
  });

  it("clamps payback at 36 months for very low ROI", () => {
    const result = computeProposalROI({
      estimatedLeads: 10,
      leadValue: 1,
      investmentPence: 100_000_000, // very high
    });
    expect(result.paybackMonths).toBeLessThanOrEqual(36);
  });

  it("returns Infinity payback when revenue is zero", () => {
    const result = computeProposalROI({
      estimatedLeads: 0,
      leadValue: 100,
      investmentPence: 100_000,
    });
    expect(result.revenue).toBe(0);
    expect(result.paybackMonths).toBe(Infinity);
  });

  it("returns roiMultiple = 0 when investment is zero", () => {
    const result = computeProposalROI({
      estimatedLeads: 10,
      leadValue: 100,
      investmentPence: 0,
    });
    expect(result.roiMultiple).toBe(0);
  });
});

describe("defaultLeadValueForEventType", () => {
  it("returns b2b value for trade-show / conference / exhibition", () => {
    expect(defaultLeadValueForEventType("trade-show")).toBe(DEFAULT_LEAD_VALUE.b2b);
    expect(defaultLeadValueForEventType("Conference")).toBe(DEFAULT_LEAD_VALUE.b2b);
    expect(defaultLeadValueForEventType("Exhibition")).toBe(DEFAULT_LEAD_VALUE.b2b);
  });

  it("returns b2c value for consumer-leaning types", () => {
    expect(defaultLeadValueForEventType("activation")).toBe(DEFAULT_LEAD_VALUE.b2c);
    expect(defaultLeadValueForEventType("festival")).toBe(DEFAULT_LEAD_VALUE.b2c);
    expect(defaultLeadValueForEventType("retail-popup")).toBe(DEFAULT_LEAD_VALUE.b2c);
  });

  it("falls back to mixed for everything else", () => {
    expect(defaultLeadValueForEventType("private-party")).toBe(DEFAULT_LEAD_VALUE.mixed);
    expect(defaultLeadValueForEventType(undefined)).toBe(DEFAULT_LEAD_VALUE.mixed);
    expect(defaultLeadValueForEventType(null)).toBe(DEFAULT_LEAD_VALUE.mixed);
    expect(defaultLeadValueForEventType("")).toBe(DEFAULT_LEAD_VALUE.mixed);
  });
});

describe("formatGBP", () => {
  it("prefixes with £ and groups thousands", () => {
    expect(formatGBP(1234)).toBe("£1,234");
    expect(formatGBP(1_000_000)).toBe("£1,000,000");
  });

  it("rounds to a whole pound", () => {
    expect(formatGBP(1234.6)).toBe("£1,235");
    expect(formatGBP(1234.4)).toBe("£1,234");
  });

  it("returns £0 for zero", () => {
    expect(formatGBP(0)).toBe("£0");
  });
});
