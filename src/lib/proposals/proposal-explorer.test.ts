import { describe, expect, it } from "vitest";

import { CAPABILITIES } from "@/lib/capabilities";
import {
  computeExplorerTotals,
  explorerOptionsForQuote,
} from "./proposal-explorer";

describe("explorerOptionsForQuote", () => {
  it("offers every tailorable capability the package doesn't already include", () => {
    const options = explorerOptionsForQuote(["lead-capture", "live-telemetry"]);
    const slugs = options.map((o) => o.slug);
    expect(slugs).not.toContain("lead-capture");
    expect(slugs).not.toContain("live-telemetry");
    expect(options).toHaveLength(CAPABILITIES.length - 2);
  });

  it("offers the full catalogue when nothing is selected and drops unknown slugs", () => {
    expect(explorerOptionsForQuote([])).toHaveLength(CAPABILITIES.length);
    expect(explorerOptionsForQuote(["not-a-capability"])).toHaveLength(
      CAPABILITIES.length,
    );
  });

  it("presents outcomes and prices, never bare slugs as labels", () => {
    const option = explorerOptionsForQuote([]).find(
      (o) => o.slug === "survey-layer",
    );
    expect(option?.outcome).toBe("One smart question between rounds");
    expect(option?.pricePence).toBe(40_000);
  });
});

describe("computeExplorerTotals", () => {
  it("adds toggled add-ons to the base fee", () => {
    const totals = computeExplorerTotals(
      2_500_000,
      ["lead-capture"],
      ["survey-layer", "dynamic-sponsors"],
    );
    // 40_000 + 65_000 on top of the quoted £25,000.
    expect(totals.baseFeePence).toBe(2_500_000);
    expect(totals.addonsPence).toBe(105_000);
    expect(totals.totalPence).toBe(2_605_000);
    expect(totals.toggled.map((o) => o.slug)).toEqual([
      "survey-layer",
      "dynamic-sponsors",
    ]);
  });

  it("never double-charges an add-on already in the package", () => {
    const totals = computeExplorerTotals(
      2_500_000,
      ["survey-layer"],
      ["survey-layer"],
    );
    expect(totals.addonsPence).toBe(0);
    expect(totals.totalPence).toBe(2_500_000);
  });

  it("ignores unknown and duplicate toggles from an untrusted client", () => {
    const totals = computeExplorerTotals(
      1_000_000,
      [],
      ["survey-layer", "survey-layer", "made-up-addon"],
    );
    expect(totals.addonsPence).toBe(40_000);
    expect(totals.toggled).toHaveLength(1);
  });

  it("treats a missing or negative base fee as zero", () => {
    expect(computeExplorerTotals(-500, [], []).totalPence).toBe(0);
    expect(computeExplorerTotals(Number.NaN, [], ["lead-capture"]).totalPence).toBe(
      45_000,
    );
  });

  it("returns toggled options in stable catalogue order regardless of input order", () => {
    const totals = computeExplorerTotals(
      0,
      [],
      ["dynamic-sponsors", "lead-capture"],
    );
    expect(totals.toggled.map((o) => o.slug)).toEqual([
      "lead-capture",
      "dynamic-sponsors",
    ]);
  });
});
