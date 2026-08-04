/** Tests for the dark-day gap board. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createSponsorshipSlot = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/venues", () => ({
  createSponsorshipSlot: (...args: unknown[]) => createSponsorshipSlot(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { DarkDayBoard } from "./DarkDayBoard";

const GAPPED = {
  placementId: "pl-1",
  label: "WES-ST-01 · The Street, ground floor",
  windowStart: "2026-08-01",
  windowEnd: "2026-12-31",
  gaps: [
    { start: "2026-08-10", end: "2026-08-12", days: 3 },
    { start: "2026-08-20", end: "2026-08-20", days: 1 },
  ],
};

const COVERED = {
  placementId: "pl-2",
  label: "Lobby unit",
  windowStart: "2026-08-01",
  windowEnd: "2026-12-31",
  gaps: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DarkDayBoard", () => {
  it("renders one row per gap and shows the day counts", () => {
    render(<DarkDayBoard placements={[GAPPED]} />);

    expect(screen.getAllByTestId("dark-gap")).toHaveLength(2);
    expect(screen.getByText("3 days")).toBeInTheDocument();
    expect(screen.getByText("1 day")).toBeInTheDocument();
    expect(screen.getByText("4 dark days")).toBeInTheDocument();
  });

  it("opens a gap for sponsorship and refreshes on success", async () => {
    createSponsorshipSlot.mockResolvedValue({ success: true, data: { id: "slot-1" } });
    const user = userEvent.setup();
    render(<DarkDayBoard placements={[GAPPED]} />);

    const buttons = screen.getAllByRole("button", { name: /open for sponsorship/i });
    await user.click(buttons[0]!);

    await waitFor(() =>
      expect(createSponsorshipSlot).toHaveBeenCalledWith({
        placementId: "pl-1",
        startDate: "2026-08-10",
        endDate: "2026-08-12",
        price: undefined,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/gap opened — it's on the market/i),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces a server refusal via toast.error and does not refresh", async () => {
    createSponsorshipSlot.mockResolvedValue({
      success: false,
      error: "That window overlaps an existing slot.",
    });
    const user = userEvent.setup();
    render(<DarkDayBoard placements={[GAPPED]} />);

    await user.click(
      screen.getAllByRole("button", { name: /open for sponsorship/i })[0]!,
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/overlaps an existing slot/i),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows Fully covered with no gap rows when a placement has no gaps", () => {
    render(<DarkDayBoard placements={[COVERED]} />);

    expect(screen.getByText("Fully covered")).toBeInTheDocument();
    expect(screen.queryByTestId("dark-gap")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /open for sponsorship/i }),
    ).not.toBeInTheDocument();
  });
});
