import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DealExplorer } from "./DealExplorer";
import type { DealConfig } from "@/lib/deal-config";
import { INFORMA_DEAL_CONFIG } from "@/lib/informa/deal";

const TEST_CONFIG: DealConfig = {
  currency: "GBP",
  split: { brightBlue: 0.7, partner: 0.3 },
  commitment: { pilotMinUnits: 12, pilotMaxUnits: 15, maxUnits: 50, cutoffWeeks: 25 },
  levers: [
    {
      key: "single",
      label: "Single placements",
      unitsPerItem: 1,
      retail: { min: 40_000, max: 65_000, suggested: 50_000, step: 1_000 },
    },
    {
      key: "bundle",
      label: "Bundles (3 units each)",
      unitsPerItem: 3,
      maxItems: 2,
      retail: { min: 100_000, max: 160_000, suggested: 120_000, step: 5_000 },
    },
  ],
  floorTiers: [
    { label: "Pilot", minUnits: 1, maxUnits: 15, floor: 14_000 },
    { label: "Scale", minUnits: 16, maxUnits: 30, floor: 12_500 },
    { label: "Portfolio", minUnits: 31, maxUnits: 50, floor: 11_000 },
  ],
};

describe("DealExplorer", () => {
  it("opens on the pilot minimum at suggested retail", () => {
    render(<DealExplorer config={TEST_CONFIG} partnerName="Acme Events" />);
    expect(screen.getByText("12 machines on the floor")).toBeInTheDocument();
    expect(screen.getByText("£600k")).toBeInTheDocument();
    expect(screen.getByText("£180k")).toBeInTheDocument();
  });

  it("recomputes the earnings when a placement is added", () => {
    render(<DealExplorer config={TEST_CONFIG} partnerName="Acme Events" />);
    const unitSlider = screen.getByRole("slider", {
      name: "Single placements count",
    });
    fireEvent.keyDown(unitSlider, { key: "ArrowRight" });
    expect(screen.getByText("13 machines on the floor")).toBeInTheDocument();
    expect(screen.getByText("£650k")).toBeInTheDocument();
  });

  it("never lets the retail slider go below the band floor", () => {
    render(<DealExplorer config={TEST_CONFIG} partnerName="Acme Events" />);
    const retailSlider = screen.getByRole("slider", {
      name: "Single placements Recommended retail per placement",
    });
    fireEvent.keyDown(retailSlider, { key: "Home" });
    expect(retailSlider).toHaveAttribute("aria-valuemin", "40000");
    expect(retailSlider).toHaveAttribute("aria-valuenow", "40000");
  });

  it("keeps the bundle retail slider disabled until a bundle is added", () => {
    render(<DealExplorer config={TEST_CONFIG} partnerName="Acme Events" />);
    const bundleRetail = screen.getByRole("slider", {
      name: "Bundles (3 units each) Recommended retail per bundle",
    });
    expect(bundleRetail).toHaveAttribute("data-disabled");
    expect(screen.getByText("add a bundle above")).toBeInTheDocument();

    const bundleSlider = screen.getByRole("slider", {
      name: "Bundles (3 units each) count",
    });
    fireEvent.keyDown(bundleSlider, { key: "ArrowRight" });
    expect(bundleRetail).not.toHaveAttribute("data-disabled");
  });

  it("caps count sliders to the shared fleet ceiling", () => {
    render(<DealExplorer config={TEST_CONFIG} partnerName="Acme Events" />);
    const bundleSlider = screen.getByRole("slider", {
      name: "Bundles (3 units each) count",
    });
    fireEvent.keyDown(bundleSlider, { key: "ArrowRight" });
    fireEvent.keyDown(bundleSlider, { key: "ArrowRight" });

    const unitSlider = screen.getByRole("slider", {
      name: "Single placements count",
    });
    expect(unitSlider).toHaveAttribute("aria-valuemax", "44");
  });

  it("renders GBP currency symbols in compact totals", () => {
    render(<DealExplorer config={TEST_CONFIG} partnerName="Acme Events" />);
    expect(screen.getByText("£600k")).toBeInTheDocument();
    expect(screen.getByText("£180k")).toBeInTheDocument();
    expect(screen.getByText("£15k")).toBeInTheDocument();
  });

  // The Loop sells screen time, not machines: its sellable-slot ceiling
  // derives live from the Informa-controlled machines in the mix
  // (rebooker + media units, six slots each). Sponsor-sold machines carry
  // that sponsor's brand alone and contribute no slots.
  it("locks the slot slider until an Informa-controlled machine is in the mix", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);

    const slotSlider = screen.getByRole("slider", {
      name: "The Loop — Screen Ad Network count",
    });
    expect(slotSlider).toHaveAttribute("aria-valuemax", "0");
    expect(screen.getByText("no host machines in the mix")).toBeInTheDocument();

    // Sponsor placements alone never unlock slots.
    fireEvent.keyDown(
      screen.getByRole("slider", { name: "The Draw — Floor & Lounge Activation count" }),
      { key: "ArrowRight" },
    );
    expect(slotSlider).toHaveAttribute("aria-valuemax", "0");
  });

  it("derives the slot ceiling from rebooker and media units, six each", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);

    const rebooker = screen.getByRole("slider", {
      name: "The Rebooker — Organizer Rebooking Engine count",
    });
    fireEvent.keyDown(rebooker, { key: "ArrowRight" });

    const mediaUnit = screen.getByRole("slider", {
      name: "Show-placed media unit — Informa-controlled, premium footfall count",
    });
    fireEvent.keyDown(mediaUnit, { key: "ArrowRight" });
    fireEvent.keyDown(mediaUnit, { key: "ArrowRight" });

    // 3 hosts x 6 slots.
    const slotSlider = screen.getByRole("slider", {
      name: "The Loop — Screen Ad Network count",
    });
    expect(slotSlider).toHaveAttribute("aria-valuemax", "18");

    fireEvent.keyDown(slotSlider, { key: "End" });
    expect(screen.getByText("18 of 18 slots")).toBeInTheDocument();
    // 12 arrival (default) + 1 rebooker + 2 media units on the floor.
    expect(screen.getByText("15 machines on the floor")).toBeInTheDocument();
  });

  it("pulls sold slots back down when host machines leave the mix", () => {
    const { container } = render(
      <DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />
    );

    const rebooker = screen.getByRole("slider", {
      name: "The Rebooker — Organizer Rebooking Engine count",
    });
    fireEvent.keyDown(rebooker, { key: "ArrowRight" });

    const slotSlider = screen.getByRole("slider", {
      name: "The Loop — Screen Ad Network count",
    });
    fireEvent.keyDown(slotSlider, { key: "End" });
    expect(screen.getByText("6 of 6 slots")).toBeInTheDocument();

    // Remove the rebooker: its screens leave with it.
    fireEvent.keyDown(rebooker, { key: "ArrowLeft" });
    expect(screen.getByText("no host machines in the mix")).toBeInTheDocument();
    expect(container.textContent).not.toContain("NaN");
  });

  it("hides the price slider for zero-retail host levers", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);
    expect(
      screen.queryByRole("slider", {
        name: /Show-placed media unit.*Recommended retail/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/It carries no line price of its own/),
    ).toBeInTheDocument();
  });

  it("keeps every figure finite when machine levers fill the whole fleet", () => {
    const { container } = render(
      <DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />
    );

    for (const name of [
      "The Arrival — Registration Takeover count",
      "The Draw — Floor & Lounge Activation count",
      "The Rebooker — Organizer Rebooking Engine count",
    ]) {
      fireEvent.keyDown(screen.getByRole("slider", { name }), { key: "End" });
    }

    expect(screen.getByText("50 machines on the floor")).toBeInTheDocument();
    expect(container.textContent).not.toContain("NaN");
  });
});
