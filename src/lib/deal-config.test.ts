import { describe, expect, it } from "vitest";

import {
  clampRetail,
  computeConfigDeal,
  floorTierForVolume,
  formatDealCurrency,
  formatDealCurrencyCompact,
  slotCapForLever,
  type DealConfig,
} from "./deal-config";

/** A small two-lever deal used across the suite. */
const CONFIG: DealConfig = {
  currency: "USD",
  split: { brightBlue: 0.7, partner: 0.3 },
  commitment: { pilotMinUnits: 12, pilotMaxUnits: 15, maxUnits: 50, cutoffWeeks: 25 },
  levers: [
    {
      key: "single",
      label: "Single placements",
      unitsPerItem: 1,
      retail: { min: 45_000, max: 70_000, suggested: 50_000, step: 1_000 },
    },
    {
      key: "bundle",
      label: "Bundles (3 units each)",
      unitsPerItem: 3,
      maxItems: 3,
      retail: { min: 110_000, max: 175_000, suggested: 120_000, step: 5_000 },
    },
  ],
  floorTiers: [
    { label: "Pilot", minUnits: 1, maxUnits: 15, floor: 15_000 },
    { label: "Scale", minUnits: 16, maxUnits: 30, floor: 13_500 },
    { label: "Portfolio", minUnits: 31, maxUnits: 50, floor: 12_000 },
  ],
};

describe("clampRetail", () => {
  it("pins values into the band from both sides", () => {
    const band = { min: 45_000, max: 70_000 };
    expect(clampRetail(10_000, band)).toBe(45_000);
    expect(clampRetail(90_000, band)).toBe(70_000);
    expect(clampRetail(52_000, band)).toBe(52_000);
  });
});

describe("floorTierForVolume", () => {
  it("lands volumes in their ladder rung", () => {
    expect(floorTierForVolume(CONFIG, 12).label).toBe("Pilot");
    expect(floorTierForVolume(CONFIG, 16).label).toBe("Scale");
    expect(floorTierForVolume(CONFIG, 50).label).toBe("Portfolio");
  });

  it("clamps zero and beyond-ceiling volumes into the ladder", () => {
    expect(floorTierForVolume(CONFIG, 0).label).toBe("Pilot");
    expect(floorTierForVolume(CONFIG, 200).label).toBe("Portfolio");
  });
});

describe("computeConfigDeal", () => {
  it("prices a multi-lever mix and counts deployed units per lever", () => {
    const deal = computeConfigDeal(CONFIG, {
      single: { count: 12, retail: 50_000 },
      bundle: { count: 1, retail: 120_000 },
    });
    // 12 + 3 machines; $600k + $120k gross.
    expect(deal.totalUnits).toBe(15);
    expect(deal.gross).toBe(720_000);
    expect(deal.partnerKeeps).toBe(216_000);
    expect(deal.brightBlueShare).toBe(504_000);
    expect(deal.partnerKeepsPerUnit).toBe(14_400);
    expect(deal.tier.label).toBe("Pilot");
    expect(deal.belowPilotMinimum).toBe(false);
  });

  it("treats missing lever inputs as zero", () => {
    const deal = computeConfigDeal(CONFIG, {
      single: { count: 12, retail: 50_000 },
    });
    expect(deal.totalUnits).toBe(12);
    expect(deal.gross).toBe(600_000);
  });

  it("ignores input keys that aren't levers in the config", () => {
    const deal = computeConfigDeal(CONFIG, {
      single: { count: 12, retail: 50_000 },
      rogue: { count: 99, retail: 1_000_000 },
    });
    expect(deal.totalUnits).toBe(12);
    expect(deal.gross).toBe(600_000);
  });

  it("clamps retail into the band so floors can't be undercut", () => {
    const deal = computeConfigDeal(CONFIG, {
      single: { count: 10, retail: 1_000 },
    });
    expect(deal.gross).toBe(450_000);
  });

  it("caps item counts at the lever's physical maximum", () => {
    const deal = computeConfigDeal(CONFIG, {
      bundle: { count: 10, retail: 120_000 },
    });
    expect(deal.totalUnits).toBe(9);
    expect(deal.gross).toBe(360_000);
  });

  it("floors fractional and negative counts to sane integers", () => {
    const deal = computeConfigDeal(CONFIG, {
      single: { count: 2.9, retail: 50_000 },
      bundle: { count: -3, retail: 120_000 },
    });
    expect(deal.totalUnits).toBe(2);
    expect(deal.gross).toBe(100_000);
  });

  it("flags mixes below the pilot minimum without flagging zero", () => {
    const below = computeConfigDeal(CONFIG, {
      single: { count: 5, retail: 50_000 },
    });
    expect(below.belowPilotMinimum).toBe(true);

    const empty = computeConfigDeal(CONFIG, {});
    expect(empty.belowPilotMinimum).toBe(false);
    expect(empty.totalUnits).toBe(0);
    expect(empty.partnerKeepsPerUnit).toBe(0);
  });
});

describe("slot-inventory levers", () => {
  /** CONFIG plus a host lever and a slot lever sourced from it. */
  const SLOT_CONFIG: DealConfig = {
    ...CONFIG,
    levers: [
      ...CONFIG.levers,
      {
        key: "host",
        label: "Organizer-controlled media unit",
        unitsPerItem: 1,
        retail: { min: 0, max: 0, suggested: 0, step: 500 },
      },
      {
        key: "slots",
        label: "Ad slots",
        unitsPerItem: 0,
        slotSource: { slotsPerUnit: 6, sourceLevers: ["host"] },
        retail: { min: 3_000, max: 8_000, suggested: 5_000, step: 500 },
      },
    ],
  };

  it("derives the sellable-slot cap from host-lever units", () => {
    const slotLever = SLOT_CONFIG.levers.find((l) => l.key === "slots")!;
    expect(slotCapForLever(slotLever, { host: 0 })).toBe(0);
    expect(slotCapForLever(slotLever, { host: 3 })).toBe(18);
    expect(slotCapForLever(slotLever, {})).toBe(0);
  });

  it("leaves machine levers uncapped by slot derivation", () => {
    const single = SLOT_CONFIG.levers.find((l) => l.key === "single")!;
    expect(slotCapForLever(single, {})).toBe(Infinity);
  });

  it("never sells a slot with no host machine in the mix", () => {
    const deal = computeConfigDeal(SLOT_CONFIG, {
      single: { count: 12, retail: 50_000 },
      slots: { count: 24, retail: 5_000 },
    });
    // No hosts: every requested slot clamps away, gross is machines only.
    expect(deal.totalUnits).toBe(12);
    expect(deal.gross).toBe(600_000);
  });

  it("clamps sold slots to the host fleet and prices hosts at zero", () => {
    const deal = computeConfigDeal(SLOT_CONFIG, {
      host: { count: 2, retail: 0 },
      slots: { count: 24, retail: 5_000 },
    });
    // 2 hosts allow 12 slots; hosts count as machines but earn nothing.
    expect(deal.totalUnits).toBe(2);
    expect(deal.gross).toBe(60_000);
  });
});

describe("currency formatting", () => {
  it("formats whole units in both supported currencies", () => {
    expect(formatDealCurrency("USD", 45_000)).toBe("$45,000");
    expect(formatDealCurrency("GBP", 45_000)).toBe("£45,000");
  });

  it("keeps one decimal on compact sub-100k values so derived stats stay consistent", () => {
    expect(formatDealCurrencyCompact("USD", 19_600)).toBe("$19.6k");
    expect(formatDealCurrencyCompact("USD", 15_000)).toBe("$15k");
    expect(formatDealCurrencyCompact("GBP", 19_600)).toBe("£19.6k");
  });

  it("rounds compact values at 100k and above to whole thousands", () => {
    expect(formatDealCurrencyCompact("USD", 234_000)).toBe("$234k");
    expect(formatDealCurrencyCompact("USD", 780_000)).toBe("$780k");
  });

  it("switches to millions with a single decimal where needed", () => {
    expect(formatDealCurrencyCompact("USD", 1_200_000)).toBe("$1.2m");
    expect(formatDealCurrencyCompact("GBP", 2_000_000)).toBe("£2m");
  });

  it("leaves sub-1k values as full currency", () => {
    expect(formatDealCurrencyCompact("USD", 950)).toBe("$950");
  });
});
