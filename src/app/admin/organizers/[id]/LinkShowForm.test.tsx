import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LinkShowForm } from "./LinkShowForm";
import type { LinkableShow } from "@/lib/queries/organizer-admin";

const linkShowToOrganizer = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/organizer-admin", () => ({
  linkShowToOrganizer: (...args: unknown[]) => linkShowToOrganizer(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const PARTNER_ID = "cccccccc-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const SHOWS: LinkableShow[] = [
  {
    id: EVENT_ID,
    name: "Tech Live South 2026",
    eventDateStart: "2026-09-15",
    venueName: "ExCeL London",
  },
];

beforeEach(() => {
  linkShowToOrganizer.mockReset();
  linkShowToOrganizer.mockResolvedValue({ success: true, data: { id: EVENT_ID } });
  refresh.mockReset();
});

describe("LinkShowForm", () => {
  it("points at creating a show when every show is already assigned", () => {
    render(<LinkShowForm partnerId={PARTNER_ID} shows={[]} />);
    expect(screen.getByText(/already assigned to an organizer/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create a show/i })).toHaveAttribute(
      "href",
      "/events/new"
    );
    expect(screen.queryByRole("button", { name: /link show/i })).not.toBeInTheDocument();
  });

  it("lists an unassigned show with its date and venue", () => {
    render(<LinkShowForm partnerId={PARTNER_ID} shows={SHOWS} />);
    expect(screen.getByRole("option", { name: /Tech Live South 2026/ })).toHaveTextContent(
      "ExCeL London"
    );
  });

  it("links the chosen show to this organizer", async () => {
    const user = userEvent.setup();
    render(<LinkShowForm partnerId={PARTNER_ID} shows={SHOWS} />);

    await user.selectOptions(screen.getByLabelText("Unassigned shows"), EVENT_ID);
    await user.click(screen.getByRole("button", { name: /link show/i }));

    await waitFor(() => {
      expect(linkShowToOrganizer).toHaveBeenCalledWith(EVENT_ID, PARTNER_ID);
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("refuses to submit with nothing chosen", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<LinkShowForm partnerId={PARTNER_ID} shows={SHOWS} />);

    await user.click(screen.getByRole("button", { name: /link show/i }));

    expect(toast.error).toHaveBeenCalledWith("Pick which show to hand over.");
    expect(linkShowToOrganizer).not.toHaveBeenCalled();
  });

  it("reports a server refusal without refreshing", async () => {
    linkShowToOrganizer.mockResolvedValue({
      success: false,
      error: "That show already belongs to another organizer. Unlink it there first.",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<LinkShowForm partnerId={PARTNER_ID} shows={SHOWS} />);

    await user.selectOptions(screen.getByLabelText("Unassigned shows"), EVENT_ID);
    await user.click(screen.getByRole("button", { name: /link show/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "That show already belongs to another organizer. Unlink it there first."
      );
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
