/**
 * Configurator behaviour: renders the default projection, and moving a lever
 * recomputes the visible numbers.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlacementConfigurator } from "./PlacementConfigurator";
import { placementValue, formatCount } from "@/lib/informa/kit-math";

describe("PlacementConfigurator", () => {
  it("renders the projection for the default levers", () => {
    render(<PlacementConfigurator />);
    const expected = placementValue({ attendees: 3_000, days: 3, priceUsd: 18_000 });
    expect(screen.getByText(formatCount(expected.impressions))).toBeInTheDocument();
    expect(screen.getByText(/cost per opted-in lead/i)).toBeInTheDocument();
  });

  it("labels the output as an illustrative projection, not a promise", () => {
    render(<PlacementConfigurator />);
    expect(screen.getByText(/illustrative projection/i)).toBeInTheDocument();
    expect(screen.getByText(/not a\s+promise/i)).toBeInTheDocument();
  });

  it("exposes all three levers as accessible sliders", () => {
    render(<PlacementConfigurator />);
    expect(screen.getByRole("slider", { name: /show attendance/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /days live/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /sponsor price/i })).toBeInTheDocument();
  });
});
