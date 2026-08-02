import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UnlinkShowButton } from "./UnlinkShowButton";

const unlinkShowFromOrganizer = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/organizer-admin", () => ({
  unlinkShowFromOrganizer: (...args: unknown[]) => unlinkShowFromOrganizer(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

beforeEach(() => {
  unlinkShowFromOrganizer.mockReset();
  unlinkShowFromOrganizer.mockResolvedValue({ success: true, data: { id: EVENT_ID } });
  refresh.mockReset();
});

describe("UnlinkShowButton", () => {
  it("asks for confirmation before removing their access", async () => {
    const user = userEvent.setup();
    render(<UnlinkShowButton eventId={EVENT_ID} showName="Tech Live South" />);

    await user.click(screen.getByRole("button", { name: /unlink tech live south/i }));

    expect(screen.getByText(/lose access to this show/i)).toBeInTheDocument();
    expect(unlinkShowFromOrganizer).not.toHaveBeenCalled();
  });

  it("unlinks once confirmed", async () => {
    const user = userEvent.setup();
    render(<UnlinkShowButton eventId={EVENT_ID} showName="Tech Live South" />);

    await user.click(screen.getByRole("button", { name: /unlink tech live south/i }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(unlinkShowFromOrganizer).toHaveBeenCalledWith(EVENT_ID));
    expect(refresh).toHaveBeenCalled();
  });

  it("backs out without unlinking", async () => {
    const user = userEvent.setup();
    render(<UnlinkShowButton eventId={EVENT_ID} showName="Tech Live South" />);

    await user.click(screen.getByRole("button", { name: /unlink tech live south/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: /unlink tech live south/i })).toBeInTheDocument();
    expect(unlinkShowFromOrganizer).not.toHaveBeenCalled();
  });

  it("reports a server refusal", async () => {
    unlinkShowFromOrganizer.mockResolvedValue({
      success: false,
      error: "Failed to unlink the show",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<UnlinkShowButton eventId={EVENT_ID} showName="Tech Live South" />);

    await user.click(screen.getByRole("button", { name: /unlink tech live south/i }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to unlink the show");
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
