/**
 * The sample report must be internally consistent (hours sum to days sum to
 * headlines) and stay inside the reach model's physical ceilings, so the
 * illustrative report never promises more than the configurator projects.
 */
import { describe, expect, it } from "vitest";

import { PLAYS_PER_DAY } from "@/lib/reach";
import { INDUSTRY_CPL } from "./kit-math";
import {
  benchmarkSavingsPct,
  optInRatePct,
  reportCpl,
  reportTotals,
  SAMPLE_REPORT,
} from "./sample-report";

const totals = reportTotals(SAMPLE_REPORT.byDay);

describe("SAMPLE_REPORT consistency", () => {
  it("sums hourly plays to the same total as the day-by-day rows", () => {
    const hourly = SAMPLE_REPORT.byHour.reduce((sum, h) => sum + h.plays, 0);
    expect(hourly).toBe(totals.plays);
  });

  it("never exceeds one machine's physical throughput on any day", () => {
    for (const day of SAMPLE_REPORT.byDay) {
      expect(day.plays).toBeLessThanOrEqual(PLAYS_PER_DAY);
      expect(day.leads).toBeLessThanOrEqual(day.plays);
    }
  });

  it("keeps the sample opt-in rate at or under the model's 90%", () => {
    expect(optInRatePct(totals.plays, totals.leads)).toBeLessThanOrEqual(90);
  });

  it("keeps every lead-quality count within the opted-in total", () => {
    const optedIn = SAMPLE_REPORT.leadQuality[0].count;
    expect(optedIn).toBe(totals.leads);
    for (const row of SAMPLE_REPORT.leadQuality) {
      expect(row.count).toBeLessThanOrEqual(optedIn);
    }
  });

  it("keeps fulfilment inside what was playable", () => {
    expect(SAMPLE_REPORT.fulfilment.samplesDispensed).toBeLessThanOrEqual(totals.plays);
  });
});

describe("report maths", () => {
  it("derives a CPL under the industry benchmark's low end", () => {
    const cpl = reportCpl(SAMPLE_REPORT.meta.priceUsd, totals.leads);
    expect(cpl).not.toBeNull();
    expect(cpl!).toBeLessThan(INDUSTRY_CPL.low);
  });

  it("returns null CPL when there are no leads", () => {
    expect(reportCpl(40_000, 0)).toBeNull();
    expect(reportCpl(0, 100)).toBeNull();
  });

  it("computes savings against the benchmark low", () => {
    expect(benchmarkSavingsPct(112)).toBe(0);
    expect(benchmarkSavingsPct(56)).toBe(50);
  });

  it("handles a zero-play day without dividing by zero", () => {
    expect(optInRatePct(0, 0)).toBe(0);
  });
});
