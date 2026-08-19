import { describe, expect, it } from "vitest";

import { decodeDealInputs, encodeDealInputs } from "./deal-share";
import type { DealConfig, DealConfigInputs } from "./deal-config";
import { INFORMA_DEAL_CONFIG } from "./informa/deal";

const CONFIG: DealConfig = {
  currency: "USD",
  split: { brightBlue: 0.7, partner: 0.3 },
  commitment: { pilotMinUnits: 5, pilotMaxUnits: 10, maxUnits: 50, cutoffWeeks: 20 },
  levers: [
    {
      key: "single",
      label: "Single placements",
      unitsPerItem: 1,
      retail: { min: 40_000, max: 65_000, suggested: 50_000, step: 1_000 },
    },
    {
      key: "bundle",
      label: "Bundles",
      unitsPerItem: 3,
      maxItems: 2,
      retail: { min: 100_000, max: 160_000, suggested: 120_000, step: 5_000 },
    },
  ],
  floorTiers: [{ label: "Pilot", minUnits: 1, maxUnits: 50, floor: 14_000 }],
};

describe("encodeDealInputs", () => {
  it("encodes only levers with items sold", () => {
    const inputs: DealConfigInputs = {
      single: { count: 4, retail: 50_000 },
      bundle: { count: 0, retail: 120_000 },
    };
    expect(encodeDealInputs(CONFIG, inputs)).toBe("mix=single.4");
  });

  it("encodes retails only when they differ from the suggested price", () => {
    const inputs: DealConfigInputs = {
      single: { count: 4, retail: 55_000 },
      bundle: { count: 1, retail: 120_000 },
    };
    expect(encodeDealInputs(CONFIG, inputs)).toBe(
      "mix=single.4_bundle.1&r=single.55000",
    );
  });

  it("marks an all-zero mix explicitly so the link still means something", () => {
    const inputs: DealConfigInputs = {
      single: { count: 0, retail: 50_000 },
      bundle: { count: 0, retail: 120_000 },
    };
    expect(encodeDealInputs(CONFIG, inputs)).toBe("mix=none");
  });
});

describe("decodeDealInputs", () => {
  it("returns null when the params carry no mix", () => {
    expect(decodeDealInputs(CONFIG, {})).toBeNull();
    expect(decodeDealInputs(CONFIG, { other: "x" })).toBeNull();
  });

  it("round-trips an encoded mix, filling missing levers with defaults", () => {
    const inputs: DealConfigInputs = {
      single: { count: 4, retail: 55_000 },
      bundle: { count: 0, retail: 120_000 },
    };
    const encoded = encodeDealInputs(CONFIG, inputs);
    const params = Object.fromEntries(new URLSearchParams(encoded));
    expect(decodeDealInputs(CONFIG, params)).toEqual({
      single: { count: 4, retail: 55_000 },
      bundle: { count: 0, retail: 120_000 },
    });
  });

  it("decodes the empty-mix sentinel to zero counts everywhere", () => {
    expect(decodeDealInputs(CONFIG, { mix: "none" })).toEqual({
      single: { count: 0, retail: 50_000 },
      bundle: { count: 0, retail: 120_000 },
    });
  });

  it("clamps tampered counts and snaps retails into their bands", () => {
    const decoded = decodeDealInputs(CONFIG, {
      mix: "single.-3_bundle.99",
      r: "bundle.1", // far below the band floor
    });
    expect(decoded).toEqual({
      single: { count: 0, retail: 50_000 },
      bundle: { count: 2, retail: 100_000 },
    });
  });

  it("snaps off-grid retails onto the band's step", () => {
    const decoded = decodeDealInputs(CONFIG, {
      mix: "single.1",
      r: "single.55432",
    });
    expect(decoded?.single.retail).toBe(55_000);
  });

  it("ignores unknown lever keys and malformed pairs", () => {
    const decoded = decodeDealInputs(CONFIG, {
      mix: "ghost.4_single.2_garbage_.5",
      r: "single.notanumber",
    });
    expect(decoded).toEqual({
      single: { count: 2, retail: 50_000 },
      bundle: { count: 0, retail: 120_000 },
    });
  });

  it("takes the first value when a param arrives as an array", () => {
    const decoded = decodeDealInputs(CONFIG, { mix: ["single.3", "single.9"] });
    expect(decoded?.single.count).toBe(3);
  });

  it("round-trips a real Informa mix including hyphenated lever keys", () => {
    const inputs: DealConfigInputs = Object.fromEntries(
      INFORMA_DEAL_CONFIG.levers.map((lever) => [
        lever.key,
        { count: 1, retail: lever.retail.suggested },
      ]),
    );
    const encoded = encodeDealInputs(INFORMA_DEAL_CONFIG, inputs);
    const params = Object.fromEntries(new URLSearchParams(encoded));
    expect(decodeDealInputs(INFORMA_DEAL_CONFIG, params)).toEqual(inputs);
  });
});
