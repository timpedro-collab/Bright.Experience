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

  // Regression: a lever that deploys no machines (The Loop, unitsPerItem 0)
  // used to divide the fleet ceiling by zero, leaking NaN into the slot
  // slider and the earnings figures.
  it("sells machine-free slot levers without NaN anywhere", () => {
    const { container } = render(
      <DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />
    );

    const slotSlider = screen.getByRole("slider", {
      name: "The Loop — Screen Ad Network count",
    });
    expect(slotSlider).toHaveAttribute("aria-valuemax", "90");

    fireEvent.keyDown(slotSlider, { key: "ArrowRight" });
    fireEvent.keyDown(slotSlider, { key: "ArrowRight" });

    // Slots add revenue but never machines.
    expect(screen.getByText("12 machines on the floor")).toBeInTheDocument();
    expect(screen.getByText("2 sold")).toBeInTheDocument();
    expect(container.textContent).not.toContain("NaN");
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
