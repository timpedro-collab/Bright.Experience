/**
 * Brief builder behaviour: the live preview mirrors the form, the send
 * affordances stay disabled until something is filled in, and copy puts the
 * exact brief text on the clipboard.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DealBriefBuilder } from "./DealBriefBuilder";

describe("DealBriefBuilder", () => {
  it("keeps copy and email disabled until the rep fills something in", () => {
    render(<DealBriefBuilder />);
    expect(screen.getByRole("button", { name: /copy the brief/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /email it to bright\.blue/i })).toBeDisabled();
    expect(screen.getByText(/the delivery brief writes itself/i)).toBeInTheDocument();
  });

  it("writes the brief preview as the rep fills in the deal", async () => {
    const user = userEvent.setup();
    render(<DealBriefBuilder />);

    await user.type(screen.getByLabelText(/sponsor company/i), "Acme Drinks");
    await user.type(screen.getByLabelText(/^show$/i), "Connect Marketplace");
    await user.click(screen.getByRole("button", { name: /capture leads/i }));

    expect(screen.getByText(/sponsor: acme drinks/i)).toBeInTheDocument();
    expect(screen.getByText(/objectives: capture leads/i)).toBeInTheDocument();
    expect(screen.getByText(/14 days of exclusivity/i)).toBeInTheDocument();
  });

  it("toggles an objective off on a second click", async () => {
    const user = userEvent.setup();
    render(<DealBriefBuilder />);

    const chip = screen.getByRole("button", { name: /sample product/i });
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/objectives:/i)).not.toBeInTheDocument();
  });

  it("copies the full brief text to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    // userEvent installs its own clipboard stub; override after setup so the
    // component's navigator.clipboard.writeText call lands on our spy.
    Object.assign(navigator.clipboard, { writeText });
    render(<DealBriefBuilder />);

    await user.type(screen.getByLabelText(/sponsor company/i), "Acme Drinks");
    await user.click(screen.getByRole("button", { name: /copy the brief/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Sponsor: Acme Drinks"));
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("links the email handoff to the deal brief inbox", async () => {
    const user = userEvent.setup();
    render(<DealBriefBuilder />);

    await user.type(screen.getByLabelText(/sponsor company/i), "Acme Drinks");

    const email = screen.getByRole("link", { name: /email it to bright\.blue/i });
    expect(email).toHaveAttribute("href", expect.stringContaining("mailto:"));
    expect(email).toHaveAttribute("href", expect.stringContaining(encodeURIComponent("Acme Drinks")));
  });
});
