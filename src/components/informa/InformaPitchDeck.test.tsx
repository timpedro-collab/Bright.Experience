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
    slideParam = "8";
    render(<InformaPitchDeck />);
    expect(screen.getByText(/the ask/i)).toBeInTheDocument();
  });

  it("disables the back arrow on the first slide", () => {
    slideParam = null;
    render(<InformaPitchDeck />);
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeDisabled();
  });
});
