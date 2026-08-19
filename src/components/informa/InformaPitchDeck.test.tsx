/**
 * Deck shell behaviour: opens on the cover, advances by button and keyboard,
 * and honours a ?slide=N deep link.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InformaPitchDeck } from "./InformaPitchDeck";

const replace = vi.fn();
let slideParam: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => slideParam }),
}));

describe("InformaPitchDeck", () => {
  it("opens on the cover slide", () => {
    slideParam = null;
    render(<InformaPitchDeck />);
    expect(
      screen.getByRole("heading", { level: 1, name: /new inventory/i })
    ).toBeInTheDocument();
  });

  it("advances to the Tampa slide from the cover button", () => {
    slideParam = null;
    render(<InformaPitchDeck />);
    fireEvent.click(screen.getByRole("button", { name: /start with tampa/i }));
    expect(replace).toHaveBeenCalledWith("?slide=2", { scroll: false });
  });

  it("advances on the right arrow key", () => {
    slideParam = null;
    render(<InformaPitchDeck />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(replace).toHaveBeenCalledWith("?slide=2", { scroll: false });
  });

  it("honours a ?slide=N deep link", () => {
    slideParam = "10";
    render(<InformaPitchDeck />);
    expect(screen.getByText(/the ask/i)).toBeInTheDocument();
  });

  it("carries the two-model decision slide", () => {
    slideParam = "6";
    render(<InformaPitchDeck />);
    expect(
      screen.getByRole("heading", { name: /tampa runs both/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/built for the format/i)).toBeInTheDocument();
  });

  it("carries the portfolio map slide with Tampa marked as the pilot", () => {
    slideParam = "7";
    render(<InformaPitchDeck />);
    expect(
      screen.getByRole("heading", { name: /one program, your whole calendar/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/starts here/i)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /dotted world map/i })
    ).toBeInTheDocument();
    // Cities render as chips naming their marquee shows.
    expect(screen.getByText(/World of Concrete/)).toBeInTheDocument();
  });

  it("disables the back arrow on the first slide", () => {
    slideParam = null;
    render(<InformaPitchDeck />);
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeDisabled();
  });
});
