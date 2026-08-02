import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReleaseMachineButton } from "./ReleaseMachineButton";

const releaseMachineFromShow = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/organizer-admin", () => ({
  releaseMachineFromShow: (...args: unknown[]) => releaseMachineFromShow(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const MACHINE_ID = "aaaaaaaa-1111-1111-1111-111111111111";

beforeEach(() => {
  releaseMachineFromShow.mockReset();
  releaseMachineFromShow.mockResolvedValue({ success: true, data: { id: MACHINE_ID } });
  refresh.mockReset();
});

describe("ReleaseMachineButton", () => {
  it("releases the unit and refreshes the show", async () => {
    const user = userEvent.setup();
    render(<ReleaseMachineButton machineInstanceId={MACHINE_ID} serialNumber="BV-2001" />);

    await user.click(screen.getByRole("button", { name: /release bv-2001/i }));

    await waitFor(() => expect(releaseMachineFromShow).toHaveBeenCalledWith(MACHINE_ID));
    expect(refresh).toHaveBeenCalled();
  });

  it("names the sponsor instead of offering a button that would fail", () => {
    render(
      <ReleaseMachineButton
        machineInstanceId={MACHINE_ID}
        serialNumber="BV-2001"
        blocked
        blockedBySponsor="Sponsor Co"
      />
    );

    expect(screen.getByText("Sold to Sponsor Co")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says a slot is open when the unit is for sale but unsold", () => {
    render(
      <ReleaseMachineButton
        machineInstanceId={MACHINE_ID}
        serialNumber="BV-2001"
        blocked
        blockedBySponsor={null}
      />
    );

    expect(screen.getByText("Sponsor slot open")).toBeInTheDocument();
  });

  it("reports a server refusal", async () => {
    releaseMachineFromShow.mockResolvedValue({
      success: false,
      error: "That machine isn't at a show.",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<ReleaseMachineButton machineInstanceId={MACHINE_ID} serialNumber="BV-2001" />);

    await user.click(screen.getByRole("button", { name: /release bv-2001/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("That machine isn't at a show.");
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
