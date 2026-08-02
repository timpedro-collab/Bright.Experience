import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SiteRequirements } from "./SiteRequirements";
import type { MachineSpec } from "@/lib/queries/organizers";

const SPEC: MachineSpec = {
  name: "Europa Experience Portal",
  slug: "experience-portal",
  tagline: null,
  heroImageUrl: null,
  capacityLabel: null,
  mechanisms: [],
  dispenses: [],
  features: [],
  bestFor: [],
  footprintMm: "W 890 × D 1000 × H 1940 mm",
  weightKg: 320,
  powerSpec: "230V AC, 13A dedicated socket",
  connectivity: "4G dual-SIM",
  clearanceNotes: "600 mm at the front",
};

describe("SiteRequirements", () => {
  it("gives the venue the numbers it asks for before move-in", () => {
    render(<SiteRequirements spec={SPEC} />);

    expect(screen.getByText("W 890 × D 1000 × H 1940 mm")).toBeInTheDocument();
    expect(screen.getByText("320 kg")).toBeInTheDocument();
    expect(screen.getByText("230V AC, 13A dedicated socket")).toBeInTheDocument();
  });

  it("flags the figures as indicative so they aren't quoted as final", () => {
    render(<SiteRequirements spec={SPEC} />);

    expect(screen.getByText(/Indicative figures/)).toBeInTheDocument();
  });

  it("offers the printable sheet when there is one to print", () => {
    render(<SiteRequirements spec={SPEC} specSheetHref="/spec" />);

    expect(screen.getByRole("link", { name: /printable sheet/i })).toHaveAttribute(
      "href",
      "/spec"
    );
  });

  it("says to ask us rather than showing an empty block", () => {
    render(
      <SiteRequirements
        spec={{
          ...SPEC,
          footprintMm: null,
          weightKg: null,
          powerSpec: null,
          connectivity: null,
          clearanceNotes: null,
        }}
      />
    );

    expect(
      screen.getByText(/haven't published site requirements/)
    ).toBeInTheDocument();
  });
});
