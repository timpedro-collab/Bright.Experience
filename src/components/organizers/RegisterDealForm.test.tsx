/** Tests for the deal-registration form. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const registerDeal = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/deal-registrations", () => ({
  registerDeal: (...args: unknown[]) => registerDeal(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { RegisterDealForm } from "./RegisterDealForm";

const SHOWS = [{ id: "show-1", name: "Spring Fair" }];

beforeEach(() => {
  vi.clearAllMocks();
});

async function openForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /register a deal/i }));
}

describe("RegisterDealForm", () => {
  it("submits the registration with the fields the organizer filled", async () => {
    registerDeal.mockResolvedValue({ success: true, data: { id: "d1" } });
    const user = userEvent.setup();
    render(<RegisterDealForm partnerSlug="informa" shows={SHOWS} />);

    await openForm(user);
    await user.type(screen.getByLabelText(/sponsor company/i), "Monster Energy");
    await user.selectOptions(screen.getByLabelText(/show/i), "show-1");
    await user.type(screen.getByLabelText(/estimated value/i), "15000");
    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() =>
      expect(registerDeal).toHaveBeenCalledWith(
        expect.objectContaining({
          partnerSlug: "informa",
          sponsorCompany: "Monster Energy",
          eventId: "show-1",
          estimatedValue: 15000,
        })
      )
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/registered — we review within 24 hours/i)
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("tells the organizer when they already hold the claim", async () => {
    registerDeal.mockResolvedValue({
      success: true,
      data: { id: "d1", alreadyRegistered: true },
    });
    const user = userEvent.setup();
    render(<RegisterDealForm partnerSlug="informa" shows={SHOWS} />);

    await openForm(user);
    await user.type(screen.getByLabelText(/sponsor company/i), "Acme");
    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/already registered to you/i)
      )
    );
  });

  it("surfaces a channel conflict from the server", async () => {
    registerDeal.mockResolvedValue({
      success: false,
      error: "That sponsor is already registered to another channel right now.",
    });
    const user = userEvent.setup();
    render(<RegisterDealForm partnerSlug="informa" shows={SHOWS} />);

    await openForm(user);
    await user.type(screen.getByLabelText(/sponsor company/i), "Acme");
    await user.click(screen.getByRole("button", { name: /^register$/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/registered to another channel/i)
      )
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
