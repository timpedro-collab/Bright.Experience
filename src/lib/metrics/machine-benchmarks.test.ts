/** Tests for catalog plays-per-day benchmark distillation. */

import { describe, it, expect } from "vitest";
import type { Benchmark } from "@/types";
import {
  playsBenchmarkForMachine,
  formatPlaysBenchmark,
} from "./machine-benchmarks";

function row(partial: Partial<Benchmark> & Pick<Benchmark, "metricName">): Benchmark {
  return {
    id: "b-1",
    eventType: "activation",
    sampleSize: 10,
    updatedAt: "2026-01-01T00:00:00Z",
    ...partial,
  } as Benchmark;
}

describe("playsBenchmarkForMachine", () => {
  it("returns null when no rows match the machine name", () => {
    const benchmarks = [
      row({
        metricName: "plays_per_day",
        machineType: "Bright.Vend Pro",
        p25Value: 200,
        p75Value: 300,
      }),
    ];

    expect(playsBenchmarkForMachine("Bright.Play", benchmarks)).toBeNull();
  });

  it("returns null when matching rows carry no usable values", () => {
    const benchmarks = [
      row({
        metricName: "plays_per_day",
        machineType: "Bright.Play",
      }),
    ];

    expect(playsBenchmarkForMachine("Bright.Play", benchmarks)).toBeNull();
  });

  it("merges rows across location tiers into one range and sums sample size", () => {
    const benchmarks = [
      row({
        metricName: "plays_per_day",
        machineType: "Bright.Play",
        locationTier: "tier_a",
        p25Value: 250,
        p75Value: 300,
        sampleSize: 28,
      }),
      row({
        id: "b-2",
        metricName: "plays_per_day",
        machineType: "Bright.Play",
        locationTier: "tier_b",
        p25Value: 175,
        p75Value: 235,
        sampleSize: 19,
      }),
    ];

    expect(playsBenchmarkForMachine("Bright.Play", benchmarks)).toEqual({
      lowPerDay: 175,
      highPerDay: 300,
      sampleSize: 47,
    });
  });

  it("falls back to median, then avg, when p25/p75 are missing", () => {
    const benchmarks = [
      row({
        metricName: "plays_per_day",
        machineType: "Bright.Play",
        medianValue: 220,
        avgValue: 225,
        sampleSize: 12,
      }),
      row({
        id: "b-2",
        metricName: "plays_per_day",
        machineType: "Bright.Play",
        avgValue: 180,
        sampleSize: 8,
      }),
    ];

    expect(playsBenchmarkForMachine("Bright.Play", benchmarks)).toEqual({
      lowPerDay: 180,
      highPerDay: 220,
      sampleSize: 20,
    });
  });

  it("ignores rows for other metrics and other machines", () => {
    const benchmarks = [
      row({
        metricName: "leads_per_day",
        machineType: "Bright.Play",
        p25Value: 50,
        p75Value: 80,
      }),
      row({
        id: "b-2",
        metricName: "plays_per_day",
        machineType: "Bright.Vend Pro",
        p25Value: 400,
        p75Value: 500,
      }),
      row({
        id: "b-3",
        metricName: "plays_per_day",
        machineType: "Bright.Play",
        p25Value: 175,
        p75Value: 300,
        sampleSize: 15,
      }),
    ];

    expect(playsBenchmarkForMachine("Bright.Play", benchmarks)).toEqual({
      lowPerDay: 175,
      highPerDay: 300,
      sampleSize: 15,
    });
  });
});

describe("formatPlaysBenchmark", () => {
  it('renders "175–300 plays/day"', () => {
    expect(
      formatPlaysBenchmark({ lowPerDay: 175, highPerDay: 300, sampleSize: 47 }),
    ).toBe("175–300 plays/day");
  });
});
