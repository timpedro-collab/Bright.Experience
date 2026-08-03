/** Tests for the post-intake instant estimate. */
import { describe, it, expect } from "vitest";
import type { BenchmarkInput } from "@/lib/metrics/expected-performance";
import { buildInstantEstimate, tierForAddons } from "./instant-estimate";

const BENCHMARKS: BenchmarkInput[] = [
  {
    metricName: "plays_per_day",
    eventType: "trade-show",
    machineType: "Bright.Play",
    p25Value: 200,
    p75Value: 280,
    sampleSize: 20,
  },
  {
    metricName: "leads_per_day",
    eventType: "trade-show",
    machineType: "Bright.Play",
    p25Value: 60,
    p75Value: 110,
    sampleSize: 20,
  },
];

describe("tierForAddons", () => {
  it("implies the base tier when no data capabilities are chosen", () => {
    expect(tierForAddons([]).slug).toBe("showstopper");
    expect(tierForAddons(["sampling-unlock"]).slug).toBe("showstopper");
  });

  it("implies Lead Engine when lead capture is chosen", () => {
    expect(tierForAddons(["lead-capture"]).slug).toBe("lead-engine");
  });

  it("implies Command when live telemetry is chosen, regardless of order", () => {
    expect(tierForAddons(["lead-capture", "live-telemetry"]).slug).toBe("command");
    expect(tierForAddons(["live-telemetry"]).slug).toBe("command");
  });
});

describe("buildInstantEstimate", () => {
  it("returns the implied tier's UK band and benchmark-backed ranges", () => {
    const estimate = buildInstantEstimate({
      addons: ["lead-capture"],
      eventType: "trade-show",
      machineType: "Bright.Play",
      days: 3,
      benchmarks: BENCHMARKS,
    });

    expect(estimate.tierName).toBe("Lead Engine");
    expect(estimate.bandLabel).toBe("£16,000–£24,000");
    expect(estimate.plays).toMatchObject({ totalLow: 600, totalHigh: 840 });
    expect(estimate.leads).toMatchObject({ totalLow: 180, totalHigh: 330 });
  });

  it("never projects leads for a tier without the lead-capture layer", () => {
    const estimate = buildInstantEstimate({
      addons: [],
      eventType: "trade-show",
      machineType: "Bright.Play",
      benchmarks: BENCHMARKS,
    });

    expect(estimate.tierSlug).toBe("showstopper");
    expect(estimate.leads).toBeNull();
    expect(estimate.plays).not.toBeNull();
  });

  it("returns null ranges rather than guessing when nothing comparable exists", () => {
    const estimate = buildInstantEstimate({
      addons: ["lead-capture"],
      eventType: "festival",
      benchmarks: BENCHMARKS,
    });

    expect(estimate.plays).toBeNull();
    expect(estimate.leads).toBeNull();
    expect(estimate.bandLabel).toBe("£16,000–£24,000");
  });
});
