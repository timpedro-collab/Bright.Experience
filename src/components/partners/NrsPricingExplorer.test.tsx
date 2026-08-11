import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NrsPricingExplorer } from "./NrsPricingExplorer";

describe("NrsPricingExplorer", () => {
  it("opens on the 12-unit pilot at suggested retail", () => {
    render(<NrsPricingExplorer />);
    expect(screen.getByText("12 machines on the floor")).toBeInTheDocument();
    // 12 × $47,500 = $570k gross; Informa keeps 40% = $228k
    expect(screen.getByText("$570k")).toBeInTheDocument();
    expect(screen.getByText("$228k")).toBeInTheDocument();
  });

  it("recomputes the earnings when a placement is added", () => {
    render(<NrsPricingExplorer />);
    const unitSlider = screen.getByRole("slider", {
      name: "Single-unit placements",
    });
    fireEvent.keyDown(unitSlider, { key: "ArrowRight" });
    expect(screen.getByText("13 machines on the floor")).toBeInTheDocument();
    // 13 × $47,500 = $617,500 gross → compact "$618k"
    expect(screen.getByText("$618k")).toBeInTheDocument();
  });

  it("never lets the single retail slider go below the $45k band floor", () => {
    render(<NrsPricingExplorer />);
    const retailSlider = screen.getByRole("slider", {
      name: "Recommended retail per single placement",
    });
    fireEvent.keyDown(retailSlider, { key: "Home" });
    expect(retailSlider).toHaveAttribute("aria-valuemin", "45000");
    expect(retailSlider).toHaveAttribute("aria-valuenow", "45000");
  });

  it("moves the mix into the Scale tier when a takeover bundle is added", () => {
    render(<NrsPricingExplorer />);
    const bundleSlider = screen.getByRole("slider", {
      name: "Cross-Hall Takeover bundles",
    });
    fireEvent.keyDown(bundleSlider, { key: "ArrowRight" });
    fireEvent.keyDown(bundleSlider, { key: "ArrowRight" });
    // 12 singles + 2 bundles × 3 = 18 units → Scale tier
    expect(screen.getByText("18 machines on the floor")).toBeInTheDocument();
    const scaleRow = screen.getByText("Scale").closest("tr");
    expect(scaleRow).not.toBeNull();
    expect(scaleRow!.textContent).toContain("current mix");
    // The bundle retail lever appears once bundles are in the mix
    expect(
      screen.getByRole("slider", { name: "Recommended retail per takeover bundle" })
    ).toBeInTheDocument();
  });

  it("warns when the mix drops below the take-or-pay minimum", () => {
    render(<NrsPricingExplorer />);
    const unitSlider = screen.getByRole("slider", {
      name: "Single-unit placements",
    });
    fireEvent.keyDown(unitSlider, { key: "ArrowLeft" });
    expect(screen.getByText(/pilot commitment is 12–15 units/i)).toBeInTheDocument();
  });
});
