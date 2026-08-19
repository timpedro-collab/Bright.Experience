/**
 * Sponsor deck behaviour: templates the hook from search params, falls back
 * to the Tampa defaults, navigates, and retunes the show from the setup
 * panel.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SponsorDeck } from "./SponsorDeck";

const replace = vi.fn();
let params: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({
    get: (key: string) => params[key] ?? null,
    entries: () => Object.entries(params)[Symbol.iterator](),
  }),
}));

describe("SponsorDeck", () => {
  it("opens on the hook with the Tampa defaults", () => {
    params = {};
    render(<SponsorDeck />);
    expect(
      screen.getByRole("heading", { level: 1, name: /3,000\+ people/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/connect marketplace/i)).toBeInTheDocument();
  });

  it("templates the deck from a per-show link", () => {
    params = {
      show: "World of Concrete",
      dates: "January 20 to 22, 2027",
      attendees: "48000",
    };
    render(<SponsorDeck />);
    expect(
      screen.getByRole("heading", { level: 1, name: /48,000\+ people/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/world of concrete/i)).toBeInTheDocument();
  });

  it("advances from the hook CTA", () => {
    params = {};
    render(<SponsorDeck />);
    fireEvent.click(
      screen.getByRole("button", { name: /see what your stand could be/i })
    );
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("slide=2"),
      { scroll: false }
    );
  });

  it("honours a ?slide=N deep link", () => {
    params = { slide: "8" };
    render(<SponsorDeck />);
    expect(screen.getByText(/lock it in/i)).toBeInTheDocument();
  });

  it("retunes the show from the setup panel", async () => {
    params = {};
    const user = userEvent.setup();
    render(<SponsorDeck />);

    await user.click(screen.getByRole("button", { name: /set up your show/i }));
    const showField = screen.getByLabelText(/^show$/i);
    await user.clear(showField);
    await user.type(showField, "SupplySide West");

    expect(
      screen.getByRole("heading", { level: 1, name: /3,000\+ people/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/supplyside west/i).length).toBeGreaterThan(0);
  });
});
