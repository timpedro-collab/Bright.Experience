/** Tests for the sponsor pitch conversion form. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SponsorInterestForm } from "./SponsorInterestForm";

const expressSponsorInterest = vi.fn();

vi.mock("@/app/actions/sponsor-pitch", () => ({
  expressSponsorInterest: (...args: unknown[]) =>
    expressSponsorInterest(...(args as [])),
}));

const TOKEN = "pitch-token-abcdefghijklmnop";

beforeEach(() => {
  expressSponsorInterest.mockReset();
  expressSponsorInterest.mockResolvedValue({
    success: true,
    data: { slotId: "slot-1" },
  });
});

function renderForm(sponsorName: string | null = null) {
  return render(
    <SponsorInterestForm
      token={TOKEN}
      sponsorName={sponsorName}
      showName="Tech Summit"
    />
  );
}

describe("SponsorInterestForm", () => {
  it("sends the enquiry and confirms the slot is held", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Your name"), "Dana Reyes");
    await user.type(screen.getByLabelText("Email"), "dana@sponsor.com");
    await user.type(screen.getByLabelText("Company"), "Sponsor Co");
    await user.click(screen.getByRole("button", { name: /request this slot/i }));

    await waitFor(() =>
      expect(expressSponsorInterest).toHaveBeenCalledWith({
        token: TOKEN,
        contactName: "Dana Reyes",
        email: "dana@sponsor.com",
        company: "Sponsor Co",
        message: undefined,
      })
    );

    expect(
      await screen.findByText(/we've held the slot for you/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Tech Summit/)).toBeInTheDocument();
  });

  it("pre-fills the company for a slot pitched to a named sponsor", () => {
    renderForm("Named Sponsor");
    expect(screen.getByLabelText("Company")).toHaveValue("Named Sponsor");
  });

  it("passes an optional note through", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Your name"), "Dana Reyes");
    await user.type(screen.getByLabelText("Email"), "dana@sponsor.com");
    await user.type(
      screen.getByLabelText(/anything you'd like to ask/i),
      "Can we send artwork?"
    );
    await user.click(screen.getByRole("button", { name: /request this slot/i }));

    await waitFor(() =>
      expect(expressSponsorInterest).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Can we send artwork?" })
      )
    );
  });

  it("keeps the form up and shows why when the send fails", async () => {
    expressSponsorInterest.mockResolvedValue({
      success: false,
      error: "This link has expired.",
    });
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Your name"), "Dana Reyes");
    await user.type(screen.getByLabelText("Email"), "dana@sponsor.com");
    await user.click(screen.getByRole("button", { name: /request this slot/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This link has expired."
    );
    expect(
      screen.getByRole("button", { name: /request this slot/i })
    ).toBeInTheDocument();
  });
});
