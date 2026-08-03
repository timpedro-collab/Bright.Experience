/** Tests for the cost-per-lead arithmetic. */
import { describe, it, expect } from "vitest";
import { getTier } from "@/lib/pricing/tiers";
import { cplBand, formatCplBand } from "./cpl";

const leadEngine = getTier("lead-engine")!;
const bespoke = getTier("bespoke")!;

describe("cplBand", () => {
  it("divides the tier band by the lead volume", () => {
    // £16,000–£24,000 across 300 leads → £53.33 → 5333p, £80 → 8000p.
    const band = cplBand(leadEngine, "uk", 300);
    expect(band).toEqual({ lowMinor: 5333, highMinor: 8000 });
  });

  it("returns null for open-ended bespoke bands", () => {
    expect(cplBand(bespoke, "uk", 300)).toBeNull();
  });

  it("returns null for zero or negative lead counts", () => {
    expect(cplBand(leadEngine, "uk", 0)).toBeNull();
    expect(cplBand(leadEngine, "uk", -50)).toBeNull();
  });
});

describe("formatCplBand", () => {
  it("formats the band in the region's currency, whole units", () => {
    expect(formatCplBand(leadEngine, "uk", 300)).toBe("£53–£80 per lead");
    expect(formatCplBand(leadEngine, "us", 300)).toBe("$107–$160 per lead");
  });

  it("collapses to a single figure when rounding makes the ends meet", () => {
    // £16,000–£24,000 across 160,000 leads → 10p vs 15p → £0 both ends.
    expect(formatCplBand(leadEngine, "uk", 160_000)).toBe("£0 per lead");
  });

  it("returns null when the band cannot be computed", () => {
    expect(formatCplBand(bespoke, "uk", 300)).toBeNull();
  });
});
