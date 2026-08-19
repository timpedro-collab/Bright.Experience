import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DealExplorer } from "./DealExplorer";
import type { DealConfig, DealConfigInputs } from "@/lib/deal-config";
import { INFORMA_DEAL_CONFIG } from "@/lib/informa/deal";

// The download button dynamic-imports pdfmake; stub the runtime so tests
// assert the document handed to it without rendering a real PDF.
const { createPdf, download } = vi.hoisted(() => {
  const download = vi.fn();
  return { download, createPdf: vi.fn((_doc: unknown) => ({ download })) };
});
vi.mock("pdfmake/build/pdfmake", () => ({
  createPdf,
  addVirtualFileSystem: vi.fn(),
}));
vi.mock("pdfmake/build/vfs_fonts", () => ({ default: {} }));

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

  // The Informa config opens on its first preset (Pilot, two shows: 2
  // registration takeovers, 2 floor takeovers, 4 in-booth machines, 2
  // rebooking engines, 2 house media units, 16 ad slots) and its slot
  // ceiling derives live from the show-controlled machines in the mix
  // (rebooking engines + house media units, six slots each). Sponsor-sold
  // machines contribute no slots.
  it("opens on the first preset scenario", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);
    expect(screen.getByText("12 machines on the floor")).toBeInTheDocument();
    expect(screen.getByText("16 of 24 slots")).toBeInTheDocument();
    // Gross sponsorship: 2×$60k + 2×$50k + 4×$30k + 16×$5k = $420k.
    expect(screen.getByText("$420k")).toBeInTheDocument();
  });

  it("switches the whole mix when a preset is clicked", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);
    fireEvent.click(screen.getByRole("button", { name: "Scale" }));
    expect(screen.getByText("28 machines on the floor")).toBeInTheDocument();
    expect(screen.getByText(/once the pilot proves out/)).toBeInTheDocument();
  });

  it("keeps rebooking service fees out of gross and shows the net position", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);
    // 2 rebooking engines × $40k are machines Informa buys, not split
    // revenue — the bottom-line box itemises them and nets them off.
    expect(
      screen.getByText(/You buy: Rebooking Engine × 2, at \$40,000 per show/),
    ).toBeInTheDocument();
    expect(screen.getByText("−$80k")).toBeInTheDocument();
    expect(screen.getByText("+$126k")).toBeInTheDocument();
    expect(screen.getByText("Net to Informa")).toBeInTheDocument();
    // Net: 30% of $420k = $126k retained, minus $80k in fees.
    expect(screen.getByText("$46k")).toBeInTheDocument();
    expect(
      screen.getByRole("slider", {
        name: "Rebooking Engine Flat service fee per show",
      }),
    ).toBeInTheDocument();
  });

  it("locks the slot slider when no show-controlled machine is in the mix", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);

    for (const name of ["Rebooking Engine count", "House Media Unit count"]) {
      fireEvent.keyDown(screen.getByRole("slider", { name }), { key: "Home" });
    }

    const slotSlider = screen.getByRole("slider", {
      name: "Screen Ad Network count",
    });
    expect(slotSlider).toHaveAttribute("aria-valuemax", "0");
    expect(screen.getByText("no host machines in the mix")).toBeInTheDocument();

    // Sponsor placements alone never unlock slots.
    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Show-Floor Takeover count" }),
      { key: "ArrowRight" },
    );
    expect(slotSlider).toHaveAttribute("aria-valuemax", "0");
  });

  it("pulls sold slots back down when host machines leave the mix", () => {
    const { container } = render(
      <DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />
    );

    // Drop the 3 house media units: 2 rebooking engines remain, 12 slots.
    fireEvent.keyDown(
      screen.getByRole("slider", { name: "House Media Unit count" }),
      { key: "Home" },
    );
    expect(screen.getByText("12 of 12 slots")).toBeInTheDocument();

    // Remove the rebooking engines too: their screens leave with them.
    fireEvent.keyDown(
      screen.getByRole("slider", { name: "Rebooking Engine count" }),
      { key: "Home" },
    );
    expect(screen.getByText("no host machines in the mix")).toBeInTheDocument();
    expect(container.textContent).not.toContain("NaN");
  });

  it("hides the price slider for zero-retail host levers", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);
    expect(
      screen.queryByRole("slider", {
        name: /House Media Unit.*(retail|fee)/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/It carries no line price of its own/),
    ).toBeInTheDocument();
  });

  it("warns when the mix cannot fund its own delivery floor", () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);

    // Strip everything that earns: only unsold house media units remain.
    for (const name of [
      "Registration Takeover count",
      "Show-Floor Takeover count",
      "In-Booth Machine count",
      "Rebooking Engine count",
      "Screen Ad Network count",
    ]) {
      fireEvent.keyDown(screen.getByRole("slider", { name }), { key: "Home" });
    }

    expect(
      screen.getByText(/below the .* delivery floor/),
    ).toBeInTheDocument();
  });

  it("keeps every figure finite when machine levers fill the whole fleet", () => {
    const { container } = render(
      <DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />
    );

    for (const name of [
      "Registration Takeover count",
      "Show-Floor Takeover count",
      "Rebooking Engine count",
    ]) {
      fireEvent.keyDown(screen.getByRole("slider", { name }), { key: "End" });
    }

    expect(screen.getByText("50 machines on the floor")).toBeInTheDocument();
    expect(container.textContent).not.toContain("NaN");
  });

  it("reopens on a shared mix instead of the preset when initial inputs arrive", () => {
    const sharedInputs: DealConfigInputs = Object.fromEntries(
      INFORMA_DEAL_CONFIG.levers.map((lever) => [
        lever.key,
        { count: lever.key === "booth" ? 3 : 0, retail: lever.retail.suggested },
      ]),
    );
    render(
      <DealExplorer
        config={INFORMA_DEAL_CONFIG}
        partnerName="Informa"
        initialInputs={sharedInputs}
      />,
    );
    expect(screen.getByText("3 machines on the floor")).toBeInTheDocument();
    // A shared link is somebody's custom scenario, not a named preset.
    expect(screen.getByText(/Custom mix/)).toBeInTheDocument();
  });

  it("copies a link that carries the exact mix", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<DealExplorer config={TEST_CONFIG} partnerName="Acme Events" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Copy link to this mix/ }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain("mix=single.12");
    expect(
      screen.getByRole("button", { name: /Link copied/ }),
    ).toBeInTheDocument();
  });

  it("downloads the mix as a branded quote PDF", async () => {
    render(<DealExplorer config={INFORMA_DEAL_CONFIG} partnerName="Informa" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Download this mix/ }),
    );

    await waitFor(() => expect(createPdf).toHaveBeenCalled());
    expect(JSON.stringify(createPdf.mock.calls[0][0])).toContain(
      "Deal scenario — Informa",
    );
    expect(download).toHaveBeenCalledWith(
      expect.stringMatching(/^Bright\.Blue-Informa-scenario-\d{4}-\d{2}-\d{2}\.pdf$/),
    );
  });
});
