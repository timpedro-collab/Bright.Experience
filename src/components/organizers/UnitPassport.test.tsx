import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { UnitPassport } from "./UnitPassport";
import type { MachineSpec } from "@/lib/queries/organizers";

const SPEC: MachineSpec = {
  name: "Europa Experience Portal",
  slug: "experience-portal",
  tagline: "Turns footfall into opted-in leads",
  heroImageUrl: "/catalog/machines/europa/01-hero-pelion.jpg",
  capacityLabel: "Up to 800 products",
  mechanisms: ["Belts", "Spirals"],
  dispenses: ["Chocolate bars", "Tech"],
  features: ["Lead capture"],
  bestFor: ["Trade shows"],
  footprintMm: "W 890 × D 1000 × H 1940 mm",
  weightKg: 320,
  powerSpec: "230V AC, 13A",
  connectivity: "4G dual-SIM",
  clearanceNotes: "600 mm at the front",
};

describe("UnitPassport", () => {
  it("names the machine and what it holds", () => {
    render(<UnitPassport spec={SPEC} />);

    expect(screen.getByText("Europa Experience Portal")).toBeInTheDocument();
    expect(screen.getByText("Up to 800 products")).toBeInTheDocument();
  });

  it("lists the dispense mechanisms and what comes out", () => {
    render(<UnitPassport spec={SPEC} />);

    expect(screen.getByText("Belts")).toBeInTheDocument();
    expect(screen.getByText("Chocolate bars")).toBeInTheDocument();
  });

  it("says what the machine is best used for", () => {
    render(<UnitPassport spec={SPEC} />);

    expect(screen.getByText("Trade shows")).toBeInTheDocument();
  });

  it("carries the serial as a footnote so the unit is identifiable", () => {
    render(<UnitPassport spec={SPEC} footnote="BB-EU-014 · firmware 2.4.1" />);

    expect(screen.getByText("BB-EU-014 · firmware 2.4.1")).toBeInTheDocument();
  });

  it("drops rows the catalogue has nothing for", () => {
    render(
      <UnitPassport
        spec={{ ...SPEC, mechanisms: [], capacityLabel: null, heroImageUrl: null }}
      />
    );

    expect(screen.queryByText("Dispense")).not.toBeInTheDocument();
    expect(screen.queryByText("Capacity")).not.toBeInTheDocument();
    expect(screen.getByText("Hands out")).toBeInTheDocument();
  });
});
