import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  NewPartnerPricingPageForm,
  DEFAULT_FLOOR_TIERS,
  DEFAULT_LEVER,
} from "./NewPartnerPricingPageForm";

const createPartnerPricingPage = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/partner-pricing", () => ({
  createPartnerPricingPage: (...args: unknown[]) =>
    createPartnerPricingPage(...(args as [])),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

beforeEach(() => {
  createPartnerPricingPage.mockReset();
  createPartnerPricingPage.mockResolvedValue({
    success: true,
    data: { id: "page-1", slug: "acme-corp-a1b2c3d4e5f6" },
  });
  refresh.mockReset();
  vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
});

describe("NewPartnerPricingPageForm", () => {
  it("renders the default deal structure", () => {
    render(<NewPartnerPricingPageForm />);

    expect(screen.getByLabelText("Partner name")).toHaveValue("");
    expect(screen.getByLabelText("Show label")).toHaveValue("");
    expect(screen.getByLabelText("Bright.Blue %")).toHaveValue(70);
    expect(screen.getByLabelText("Partner %")).toHaveValue(30);
    expect(screen.getByLabelText("Pilot min units")).toHaveValue(12);
    expect(screen.getByLabelText("Pilot max units")).toHaveValue(15);
    expect(document.getElementById("max-units")).toHaveValue(50);
    expect(screen.getByLabelText("Cutoff weeks")).toHaveValue(25);
    expect(screen.getByLabelText("Lever label")).toHaveValue(DEFAULT_LEVER.label);
    expect(screen.getByLabelText("Units per item")).toHaveValue(
      Number(DEFAULT_LEVER.unitsPerItem),
    );
    expect(screen.getByLabelText("Retail min")).toHaveValue(
      Number(DEFAULT_LEVER.retailMin),
    );
    expect(screen.getByLabelText("Retail max")).toHaveValue(
      Number(DEFAULT_LEVER.retailMax),
    );
    expect(screen.getByLabelText("Retail suggested")).toHaveValue(
      Number(DEFAULT_LEVER.retailSuggested),
    );
    expect(screen.getByLabelText("Retail step")).toHaveValue(
      Number(DEFAULT_LEVER.retailStep),
    );

    for (const tier of DEFAULT_FLOOR_TIERS) {
      expect(screen.getByDisplayValue(tier.label)).toBeInTheDocument();
    }
  });

  it("shows a split-sum validation error when percentages do not total 100", async () => {
    const user = userEvent.setup();
    render(<NewPartnerPricingPageForm />);

    await user.clear(screen.getByLabelText("Bright.Blue %"));
    await user.type(screen.getByLabelText("Bright.Blue %"), "60");
    await user.clear(screen.getByLabelText("Partner %"));
    await user.type(screen.getByLabelText("Partner %"), "30");
    await user.type(screen.getByLabelText("Partner name"), "Acme Corp");
    await user.type(screen.getByLabelText("Show label"), "NRS 2026");
    await user.click(screen.getByRole("button", { name: /create page/i }));

    expect(
      await screen.findByText("Bright.Blue % and Partner % must sum to 100."),
    ).toBeInTheDocument();
    expect(createPartnerPricingPage).not.toHaveBeenCalled();
  });

  it("submits a well-formed DealConfig on success", async () => {
    const user = userEvent.setup();
    render(<NewPartnerPricingPageForm />);

    await user.type(screen.getByLabelText("Partner name"), "Acme Corp");
    await user.type(screen.getByLabelText("Show label"), "NRS 2026");
    await user.click(screen.getByRole("button", { name: /create page/i }));

    await waitFor(() => {
      expect(createPartnerPricingPage).toHaveBeenCalledWith({
        partnerName: "Acme Corp",
        showLabel: "NRS 2026",
        config: {
          currency: "USD",
          split: { brightBlue: 0.7, partner: 0.3 },
          commitment: {
            pilotMinUnits: 12,
            pilotMaxUnits: 15,
            maxUnits: 50,
            cutoffWeeks: 25,
          },
          levers: [
            {
              key: "single-unit-placements",
              label: "Single-unit placements",
              unitsPerItem: 1,
              retail: {
                min: 45000,
                max: 70000,
                suggested: 50000,
                step: 1000,
              },
            },
          ],
          floorTiers: [
            { label: "Pilot", minUnits: 1, maxUnits: 15, floor: 15000 },
            { label: "Scale", minUnits: 16, maxUnits: 30, floor: 13500 },
            { label: "Portfolio", minUnits: 31, maxUnits: 50, floor: 12000 },
          ],
        },
      });
    });

    expect(refresh).toHaveBeenCalled();
    expect(await screen.findByText(/page created/i)).toBeInTheDocument();
  });
});
