import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InviteOrganizerForm } from "./InviteOrganizerForm";

const inviteOrganizerUser = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/organizer-admin", () => ({
  inviteOrganizerUser: (...args: unknown[]) => inviteOrganizerUser(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const PARTNER_ID = "cccccccc-1111-1111-1111-111111111111";

beforeEach(() => {
  inviteOrganizerUser.mockReset();
  inviteOrganizerUser.mockResolvedValue({
    success: true,
    data: { profileId: "p1", existingUser: false },
  });
  refresh.mockReset();
});

describe("InviteOrganizerForm", () => {
  it("invites the organizer's lead with full access by default", async () => {
    const user = userEvent.setup();
    render(<InviteOrganizerForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "nadia@informa.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(inviteOrganizerUser).toHaveBeenCalledWith(
        PARTNER_ID,
        "nadia@informa.example",
        "partner_admin"
      );
    });
  });

  it("can invite a view-only member of their team", async () => {
    const user = userEvent.setup();
    render(<InviteOrganizerForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "viewer@informa.example");
    await user.selectOptions(screen.getByLabelText("Access"), "partner_member");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(inviteOrganizerUser).toHaveBeenCalledWith(
        PARTNER_ID,
        "viewer@informa.example",
        "partner_member"
      );
    });
  });

  it("sends nothing without an email address", async () => {
    const user = userEvent.setup();
    render(<InviteOrganizerForm partnerId={PARTNER_ID} />);

    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(inviteOrganizerUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email address")).toBeInvalid();
  });

  it("sends nothing for an address that isn't one", async () => {
    const user = userEvent.setup();
    render(<InviteOrganizerForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "nadia-at-informa");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(inviteOrganizerUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email address")).toBeInvalid();
  });

  it("says access was granted rather than sent for someone already on the platform", async () => {
    inviteOrganizerUser.mockResolvedValue({
      success: true,
      data: { profileId: "p1", existingUser: true },
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<InviteOrganizerForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "known@informa.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("known@informa.example now has access");
    });
  });

  it("clears the field and refreshes the team list on success", async () => {
    const user = userEvent.setup();
    render(<InviteOrganizerForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "nadia@informa.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByLabelText("Email address")).toHaveValue("");
  });

  it("keeps the typed email when the server refuses", async () => {
    inviteOrganizerUser.mockResolvedValue({ success: false, error: "That organizer doesn't exist" });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<InviteOrganizerForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "nadia@informa.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("That organizer doesn't exist");
    });
    expect(screen.getByLabelText("Email address")).toHaveValue("nadia@informa.example");
    expect(refresh).not.toHaveBeenCalled();
  });
});
