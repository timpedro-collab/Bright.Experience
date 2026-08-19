import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdNetworkMediaKit } from "./AdNetworkMediaKit";
import { adNetworkFunnel, slotMetrics } from "@/lib/informa/ad-network";
import { formatCount } from "@/lib/informa/kit-math";

describe("AdNetworkMediaKit", () => {
  it("renders the measured funnel with the sample show's logged numbers", () => {
    render(<AdNetworkMediaKit />);
    const list = screen.getByRole("list", {
      name: /measured funnel from the sample show/i,
    });
    expect(list).toBeInTheDocument();
    for (const stage of adNetworkFunnel()) {
      expect(screen.getByText(formatCount(stage.value))).toBeInTheDocument();
    }
  });

  it("shows the per-slot delivery and share of voice", () => {
    render(<AdNetworkMediaKit />);
    const metrics = slotMetrics();
    expect(screen.getByText(formatCount(metrics.playsPerSlot))).toBeInTheDocument();
    expect(screen.getByText(`${formatCount(metrics.screenMinutesPerSlot)} min`)).toBeInTheDocument();
    expect(screen.getByText("1 in 6")).toBeInTheDocument();
  });

  it("prices slots off the rate card and links to the sample report", () => {
    render(<AdNetworkMediaKit />);
    expect(screen.getByText(/\$3,000 to \$8,000/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /sample report/i }),
    ).toHaveAttribute("href", "/informa/report");
  });

  it("repeats the show-controlled-machines rule", () => {
    render(<AdNetworkMediaKit />);
    expect(
      screen.getByText(/machines the show controls/i),
    ).toBeInTheDocument();
  });
});
