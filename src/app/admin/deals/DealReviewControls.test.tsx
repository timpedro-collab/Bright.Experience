/** Tests for the internal deal-review controls. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const approveDealRegistration = vi.fn();
const rejectDealRegistration = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/deal-registrations", () => ({
  approveDealRegistration: (...args: unknown[]) => approveDealRegistration(...args),
  rejectDealRegistration: (...args: unknown[]) => rejectDealRegistration(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { DealReviewControls } from "./DealReviewControls";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DealReviewControls", () => {
  it("approves in one click and confirms the window started", async () => {
    approveDealRegistration.mockResolvedValue({ success: true, data: { id: "d1" } });
    const user = userEvent.setup();
    render(<DealReviewControls registrationId="d1" sponsorCompany="Acme" />);

    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(approveDealRegistration).toHaveBeenCalledWith("d1"));
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/14-day window started/i)
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("requires a reason before rejecting", async () => {
    const user = userEvent.setup();
    render(<DealReviewControls registrationId="d1" sponsorCompany="Acme" />);

    await user.click(screen.getByRole("button", { name: /reject/i }));
    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    expect(rejectDealRegistration).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/reason/i)
    );
  });

  it("rejects with the typed reason", async () => {
    rejectDealRegistration.mockResolvedValue({ success: true, data: { id: "d1" } });
    const user = userEvent.setup();
    render(<DealReviewControls registrationId="d1" sponsorCompany="Acme" />);

    await user.click(screen.getByRole("button", { name: /reject/i }));
    await user.type(
      screen.getByLabelText(/rejection reason/i),
      "Already talking to them directly"
    );
    await user.click(screen.getByRole("button", { name: /^reject$/i }));

    await waitFor(() =>
      expect(rejectDealRegistration).toHaveBeenCalledWith(
        "d1",
        "Already talking to them directly"
      )
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces a failed approval without refreshing", async () => {
    approveDealRegistration.mockResolvedValue({
      success: false,
      error: "Only a pending registration can be approved",
    });
    const user = userEvent.setup();
    render(<DealReviewControls registrationId="d1" sponsorCompany="Acme" />);

    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Only a pending registration can be approved"
      )
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
