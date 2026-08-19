import { describe, expect, it } from "vitest";

import {
  AD_LOOP_MECHANICS,
  adNetworkFunnel,
  SLOT_MECHANICS,
  slotMetrics,
} from "./ad-network";
import { productById } from "./products";
import { reportTotals, SAMPLE_REPORT } from "./sample-report";

describe("adNetworkFunnel", () => {
  it("derives every stage from the sample report, so the two never disagree", () => {
    const stages = adNetworkFunnel();
    const totals = reportTotals(SAMPLE_REPORT.byDay);
    expect(stages.map((s) => s.value)).toEqual([
      SAMPLE_REPORT.adLoop.contentPlays,
      totals.plays,
      totals.leads,
    ]);
  });

  it("narrows at every stage, largest first", () => {
    const values = adNetworkFunnel().map((s) => s.value);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]);
    }
  });

  it("explains how each number is measured", () => {
    for (const stage of adNetworkFunnel()) {
      expect(stage.detail.length).toBeGreaterThan(10);
    }
  });
});

describe("slotMetrics", () => {
  it("splits the logged loop total evenly across the loop's slots", () => {
    const { playsPerSlot } = slotMetrics();
    expect(playsPerSlot).toBe(
      Math.round(SAMPLE_REPORT.adLoop.contentPlays / SAMPLE_REPORT.adLoop.slots),
    );
  });

  it("converts slot plays into whole minutes of brand screen time", () => {
    const { playsPerSlot, screenMinutesPerSlot } = slotMetrics();
    expect(screenMinutesPerSlot).toBe(
      Math.round((playsPerSlot * AD_LOOP_MECHANICS.slotSeconds) / 60),
    );
    expect(screenMinutesPerSlot).toBeGreaterThan(0);
  });

  it("prices and sizes slots straight off the rate card", () => {
    expect(AD_LOOP_MECHANICS.retail).toEqual(productById("loop").retail);
    expect(AD_LOOP_MECHANICS.slotsPerLoop).toBe(SAMPLE_REPORT.adLoop.slots);
    expect(slotMetrics().shareOfVoicePct).toBe(
      Math.round(100 / SAMPLE_REPORT.adLoop.slots),
    );
  });
});

describe("SLOT_MECHANICS", () => {
  it("repeats the show-controlled-machines rule so the kit can't oversell", () => {
    const whereSlotLive = SLOT_MECHANICS.find((m) => m.title === "Where slots live");
    expect(whereSlotLive?.detail).toMatch(/machines the show controls/i);
    expect(whereSlotLive?.detail).toMatch(/never in this inventory/i);
  });
});
