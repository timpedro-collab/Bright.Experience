/** Tests for the placement SKU editor. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const updatePlacementSku = vi.fn();
const publishPlacementSku = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/venues", () => ({
  updatePlacementSku: (...args: unknown[]) => updatePlacementSku(...args),
  publishPlacementSku: (...args: unknown[]) => publishPlacementSku(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { PlacementSkuEditor } from "./PlacementSkuEditor";

const PLACEMENT_ID = "pl-1";

const BASE_PROPS = {
  placementId: PLACEMENT_ID,
  skuCode: null as string | null,
  locationLabel: null as string | null,
  footfallEstimate: null as number | null,
  maxSlotsPerSponsor: null as number | null,
  skuStatus: "draft" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

async function openEditor(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /edit sku details/i }));
}

describe("PlacementSkuEditor", () => {
  it("sends only the filled SKU fields on save", async () => {
    updatePlacementSku.mockResolvedValue({
      success: true,
      data: { id: PLACEMENT_ID },
    });
    const user = userEvent.setup();
    render(<PlacementSkuEditor {...BASE_PROPS} />);

    await openEditor(user);
    await user.type(screen.getByLabelText(/sku code/i), "WES-ST-01");
    await user.type(screen.getByLabelText(/daily footfall/i), "12000");
    await user.click(screen.getByRole("button", { name: /save sku details/i }));

    await waitFor(() =>
      expect(updatePlacementSku).toHaveBeenCalledWith({
        placementId: PLACEMENT_ID,
        skuCode: "WES-ST-01",
        footfallEstimate: 12000,
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("publishes a draft placement to the advertise page", async () => {
    publishPlacementSku.mockResolvedValue({
      success: true,
      data: { id: PLACEMENT_ID },
    });
    const user = userEvent.setup();
    render(<PlacementSkuEditor {...BASE_PROPS} skuStatus="draft" />);

    await user.click(
      screen.getByRole("button", { name: /publish to advertise page/i }),
    );

    await waitFor(() =>
      expect(publishPlacementSku).toHaveBeenCalledWith(PLACEMENT_ID, true),
    );
    expect(toast.success).toHaveBeenCalledWith("Placement published");
    expect(refresh).toHaveBeenCalled();
  });

  it("unpublishes a live placement", async () => {
    publishPlacementSku.mockResolvedValue({
      success: true,
      data: { id: PLACEMENT_ID },
    });
    const user = userEvent.setup();
    render(<PlacementSkuEditor {...BASE_PROPS} skuStatus="live" />);

    await user.click(screen.getByRole("button", { name: /^unpublish$/i }));

    await waitFor(() =>
      expect(publishPlacementSku).toHaveBeenCalledWith(PLACEMENT_ID, false),
    );
    expect(toast.success).toHaveBeenCalledWith("Placement unpublished");
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces a server failure via toast.error", async () => {
    updatePlacementSku.mockResolvedValue({
      success: false,
      error: "SKU code is already in use.",
    });
    const user = userEvent.setup();
    render(<PlacementSkuEditor {...BASE_PROPS} />);

    await openEditor(user);
    await user.type(screen.getByLabelText(/sku code/i), "WES-ST-99");
    await user.click(screen.getByRole("button", { name: /save sku details/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/already in use/i),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
