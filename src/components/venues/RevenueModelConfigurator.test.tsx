/** Tests for the placement revenue model configurator. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const updatePlacementPricing = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/venues", () => ({
  updatePlacementPricing: (...args: unknown[]) => updatePlacementPricing(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { RevenueModelConfigurator } from "./RevenueModelConfigurator";

const PLACEMENT_ID = "pl-1";

beforeEach(() => {
  vi.clearAllMocks();
});

async function openConfigurator(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: /set revenue model/i }),
  );
}

describe("RevenueModelConfigurator", () => {
  it("shows a live preview for revenue share and saves the converted rate", async () => {
    updatePlacementPricing.mockResolvedValue({
      success: true,
      data: { id: PLACEMENT_ID },
    });
    const user = userEvent.setup();
    render(
      <RevenueModelConfigurator placementId={PLACEMENT_ID} current={null} />,
    );

    await openConfigurator(user);
    await user.selectOptions(
      screen.getByLabelText(/^model$/i),
      "revenue_share",
    );
    await user.type(screen.getByLabelText(/your share/i), "20");

    expect(
      screen.getByText(/on £20,000 of bookings you'd earn £4,000/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /save revenue model/i }),
    );

    await waitFor(() =>
      expect(updatePlacementPricing).toHaveBeenCalledWith({
        placementId: PLACEMENT_ID,
        pricing: { model: "revenue_share", rate: 0.2 },
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Revenue model saved");
    expect(refresh).toHaveBeenCalled();
  });

  it("converts guarantee and overage fields to pence and rate", async () => {
    updatePlacementPricing.mockResolvedValue({
      success: true,
      data: { id: PLACEMENT_ID },
    });
    const user = userEvent.setup();
    render(
      <RevenueModelConfigurator placementId={PLACEMENT_ID} current={null} />,
    );

    await openConfigurator(user);
    await user.selectOptions(
      screen.getByLabelText(/^model$/i),
      "guarantee_overage",
    );
    await user.type(screen.getByLabelText(/^guarantee/i), "4000");
    await user.type(screen.getByLabelText(/share above it/i), "25");
    await user.click(
      screen.getByRole("button", { name: /save revenue model/i }),
    );

    await waitFor(() =>
      expect(updatePlacementPricing).toHaveBeenCalledWith({
        placementId: PLACEMENT_ID,
        pricing: {
          model: "guarantee_overage",
          guaranteePence: 400_000,
          overageRate: 0.25,
        },
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces a server failure via toast.error without refresh", async () => {
    updatePlacementPricing.mockResolvedValue({
      success: false,
      error: "You do not have permission to edit this placement.",
    });
    const user = userEvent.setup();
    render(
      <RevenueModelConfigurator placementId={PLACEMENT_ID} current={null} />,
    );

    await openConfigurator(user);
    await user.type(screen.getByLabelText(/your share/i), "18");
    await user.click(
      screen.getByRole("button", { name: /save revenue model/i }),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/permission/i),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
