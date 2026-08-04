/** Tests for the MCP response formatters. */
import { describe, it, expect } from "vitest";

import {
  machineMatchesQuery,
  formatMachines,
  formatPricing,
  formatBenchmarks,
  type McpMachine,
} from "./format";
import type { IndexSection } from "@/lib/bright-index/shape";

const machine: McpMachine = {
  name: "Bright.Play",
  slug: "bright-play",
  tagline: "The arcade flagship",
  capacityLabel: "600 prizes",
  mechanisms: ["claw", "vend"],
};

describe("machineMatchesQuery", () => {
  it("matches on name, tagline, and mechanisms case-insensitively", () => {
    expect(machineMatchesQuery(machine, "ARCADE")).toBe(true);
    expect(machineMatchesQuery(machine, "claw")).toBe(true);
    expect(machineMatchesQuery(machine, "popcorn")).toBe(false);
  });

  it("treats a blank query as match-all", () => {
    expect(machineMatchesQuery(machine, "  ")).toBe(true);
  });
});

describe("formatMachines", () => {
  it("renders name, catalog path, and detail line", () => {
    const text = formatMachines([machine]);
    expect(text).toContain("**Bright.Play**");
    expect(text).toContain("/catalog/machines/bright-play");
    expect(text).toContain("Capacity: 600 prizes");
  });

  it("suggests broadening when nothing matches", () => {
    expect(formatMachines([])).toContain("No machines matched");
  });
});

describe("formatPricing", () => {
  it("renders every display tier with a band for the region", () => {
    const text = formatPricing("uk");
    expect(text).toContain("UK");
    expect(text).toContain("£");
    expect(text).toContain("1 business day");
  });
});

describe("formatBenchmarks", () => {
  it("renders sections with medians, bands, and sample sizes", () => {
    const sections: IndexSection[] = [
      {
        eventType: "activation",
        eventTypeLabel: "Brand activations",
        metrics: [
          {
            metricName: "plays_per_day",
            metricLabel: "Plays per day",
            unit: "plays",
            entries: [
              {
                tier: "tier_1",
                tierLabel: "Premium venues",
                machineType: "Bright.Play",
                median: 270,
                p25: 250,
                p75: 300,
                sampleSize: 28,
              },
            ],
          },
        ],
      },
    ];
    const text = formatBenchmarks(sections);
    expect(text).toContain("Brand activations");
    expect(text).toContain("median 270");
    expect(text).toContain("middle 50%: 250–300");
    expect(text).toContain("n=28");
  });

  it("points at the Index page when nothing is published", () => {
    expect(formatBenchmarks([])).toContain("/bright-index");
  });
});
