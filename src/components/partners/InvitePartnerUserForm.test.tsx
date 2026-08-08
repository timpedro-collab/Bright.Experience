import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InvitePartnerUserForm } from "./InvitePartnerUserForm";

const invitePartnerUser = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/partner-admin", () => ({
  invitePartnerUser: (...args: unknown[]) => invitePartnerUser(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const PARTNER_ID = "cccccccc-1111-1111-1111-111111111111";

beforeEach(() => {
  invitePartnerUser.mockReset();
  invitePartnerUser.mockResolvedValue({
    success: true,
    data: { profileId: "p1", existingUser: false },
  });
  refresh.mockReset();
});

describe("InvitePartnerUserForm", () => {
  it("invites the partner's lead with full access by default", async () => {
    const user = userEvent.setup();
    render(<InvitePartnerUserForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "dana@venue.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(invitePartnerUser).toHaveBeenCalledWith(
        PARTNER_ID,
        "dana@venue.example",
        "partner_admin"
      );
    });
  });

  it("can invite a view-only member of their team", async () => {
    const user = userEvent.setup();
    render(<InvitePartnerUserForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "viewer@venue.example");
    await user.selectOptions(screen.getByLabelText("Access"), "partner_member");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(invitePartnerUser).toHaveBeenCalledWith(
        PARTNER_ID,
        "viewer@venue.example",
        "partner_member"
      );
    });
  });

  it("sends nothing without an email address", async () => {
    const user = userEvent.setup();
    render(<InvitePartnerUserForm partnerId={PARTNER_ID} />);

    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(invitePartnerUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email address")).toBeInvalid();
  });

  it("sends nothing for an address that isn't one", async () => {
    const user = userEvent.setup();
    render(<InvitePartnerUserForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "dana-at-venue");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(invitePartnerUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email address")).toBeInvalid();
  });

  it("says access was granted rather than sent for someone already on the platform", async () => {
    invitePartnerUser.mockResolvedValue({
      success: true,
      data: { profileId: "p1", existingUser: true },
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<InvitePartnerUserForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "known@venue.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("known@venue.example now has access");
    });
  });

  it("clears the field and refreshes the team list on success", async () => {
    const user = userEvent.setup();
    render(<InvitePartnerUserForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "dana@venue.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByLabelText("Email address")).toHaveValue("");
  });

  it("keeps the typed email when the server refuses", async () => {
    invitePartnerUser.mockResolvedValue({ success: false, error: "That partner doesn't exist" });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<InvitePartnerUserForm partnerId={PARTNER_ID} />);

    await user.type(screen.getByLabelText("Email address"), "dana@venue.example");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("That partner doesn't exist");
    });
    expect(screen.getByLabelText("Email address")).toHaveValue("dana@venue.example");
    expect(refresh).not.toHaveBeenCalled();
  });
});
