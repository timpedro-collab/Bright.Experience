import { describe, expect, it } from "vitest";

import {
  buildDealQuoteDoc,
  quoteFileName,
  quoteLinesFor,
  type DealQuoteContext,
} from "./deal-quote";
import { computeConfigDeal, type DealConfigInputs } from "./deal-config";
import { INFORMA_DEAL_CONFIG } from "./informa/deal";

/** The Informa Pilot preset mix, priced at suggested retail. */
function pilotInputs(): DealConfigInputs {
  const counts = INFORMA_DEAL_CONFIG.presets![0].counts;
  return Object.fromEntries(
    INFORMA_DEAL_CONFIG.levers.map((lever) => [
      lever.key,
      { count: counts[lever.key] ?? 0, retail: lever.retail.suggested },
    ]),
  );
}

function pilotContext(overrides?: Partial<DealQuoteContext>): DealQuoteContext {
  const inputs = pilotInputs();
  return {
    config: INFORMA_DEAL_CONFIG,
    inputs,
    deal: computeConfigDeal(INFORMA_DEAL_CONFIG, inputs),
    partnerName: "Informa",
    scenarioLabel: "Pilot",
    date: new Date("2026-08-19T12:00:00Z"),
    ...overrides,
  };
}

/** Every string anywhere in the (nested) doc definition, flattened. */
function allText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(allText).join("\n");
  if (typeof node === "object") return Object.values(node).map(allText).join("\n");
  return "";
}

describe("quoteLinesFor", () => {
  it("keeps only levers with items sold and puts service fees last", () => {
    const lines = quoteLinesFor(INFORMA_DEAL_CONFIG, pilotInputs());
    expect(lines.map((l) => l.label)).toEqual([
      "Registration Takeover",
      "Show-Floor Takeover",
      "In-Booth Machine",
      "House Media Unit",
      "Screen Ad Network",
      "Rebooking Engine",
    ]);
    expect(lines.at(-1)?.isService).toBe(true);
  });

  it("multiplies count by retail per line", () => {
    const lines = quoteLinesFor(INFORMA_DEAL_CONFIG, pilotInputs());
    const arrival = lines.find((l) => l.label === "Registration Takeover");
    expect(arrival).toMatchObject({ count: 2, retail: 60_000, total: 120_000 });
  });
});

describe("quoteFileName", () => {
  it("builds a dated, filesystem-safe name from the partner", () => {
    expect(quoteFileName("Informa / Connect!", new Date("2026-08-19T12:00:00Z"))).toBe(
      "Bright.Blue-Informa-Connect-scenario-2026-08-19.pdf",
    );
  });
});

describe("buildDealQuoteDoc", () => {
  it("renders the on-screen economics: gross, retained, fees, net", () => {
    const text = allText(buildDealQuoteDoc(pilotContext()));
    // Pilot preset (2 shows): gross 2×$60k + 2×$50k + 4×$30k + 16×$5k =
    // $420k, Informa retains 30% = $126k, 2 rebooking engines × $40k =
    // $80k in fees, net $46k.
    expect(text).toContain("$420,000");
    expect(text).toContain("+$126,000");
    expect(text).toContain("−$80,000");
    expect(text).toContain("Net to Informa");
    expect(text).toContain("$46,000");
  });

  it("names the scenario and the tier in the header", () => {
    const text = allText(buildDealQuoteDoc(pilotContext()));
    expect(text).toContain("Deal scenario — Informa");
    expect(text).toContain("Pilot · 12 machines on the floor · Pilot tier");
  });

  it("carries no warnings on a healthy mix", () => {
    const text = allText(buildDealQuoteDoc(pilotContext()));
    expect(text).not.toContain("below the pilot commitment");
    expect(text).not.toContain("delivery floor of");
  });

  it("warns on the sheet when the mix misses the pilot minimum or the floor", () => {
    const inputs = pilotInputs();
    // One $45k sponsor placement plus five unsold house units: 6 machines
    // is below the 12-unit pilot minimum, and Bright.Blue's $31.5k share
    // can't cover the $15k-per-machine Pilot floor across 6 machines.
    for (const key of Object.keys(inputs)) inputs[key] = { ...inputs[key], count: 0 };
    inputs.arrival = { count: 1, retail: 45_000 };
    inputs["media-unit"] = { count: 5, retail: 0 };
    const deal = computeConfigDeal(INFORMA_DEAL_CONFIG, inputs);
    const text = allText(buildDealQuoteDoc(pilotContext({ inputs, deal })));
    expect(text).toContain("below the pilot commitment");
    expect(text).toContain("wouldn't fund its own delivery");
  });

  it("links back to the live mix when a page URL is provided", () => {
    const url = "https://bright-experience.vercel.app/pp/x?mix=arrival.2";
    const text = allText(buildDealQuoteDoc(pilotContext({ pageUrl: url })));
    expect(text).toContain(url);
  });

  it("omits the link line when no page URL is known", () => {
    const text = allText(buildDealQuoteDoc(pilotContext()));
    expect(text).not.toContain("Live version of this exact mix");
  });
});
