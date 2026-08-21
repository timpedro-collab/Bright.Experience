/**
 * Shared deck shell behaviour: opens on the first slide, advances by
 * button and keyboard, honours a ?slide=N deep link, and clamps
 * out-of-range links instead of crashing.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeckShell, type DeckShellSlideProps } from "./DeckShell";

const replace = vi.fn();
let slideParam: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => slideParam }),
}));

function makeSlide(label: string) {
  return function Slide({ onAdvance, slideNumber }: DeckShellSlideProps) {
    return (
      <div>
        <h1>{label}</h1>
        <p>slide number {slideNumber}</p>
        <button type="button" onClick={onAdvance}>
          Advance from {label}
        </button>
      </div>
    );
  };
}

const SLIDES = [
  { id: "one", Component: makeSlide("First slide") },
  { id: "two", Component: makeSlide("Second slide") },
  { id: "three", Component: makeSlide("Third slide") },
];

describe("DeckShell", () => {
  it("opens on the first slide", () => {
    slideParam = null;
    render(<DeckShell slides={SLIDES} />);
    expect(
      screen.getByRole("heading", { name: /first slide/i })
    ).toBeInTheDocument();
    expect(screen.getByText("slide number 1")).toBeInTheDocument();
  });

  it("advances via a slide's own CTA", () => {
    slideParam = null;
    render(<DeckShell slides={SLIDES} />);
    fireEvent.click(
      screen.getByRole("button", { name: /advance from first slide/i })
    );
    expect(replace).toHaveBeenCalledWith("?slide=2", { scroll: false });
  });

  it("advances on the right arrow key", () => {
    slideParam = null;
    render(<DeckShell slides={SLIDES} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(replace).toHaveBeenCalledWith("?slide=2", { scroll: false });
  });

  it("honours a ?slide=N deep link", () => {
    slideParam = "3";
    render(<DeckShell slides={SLIDES} />);
    expect(
      screen.getByRole("heading", { name: /third slide/i })
    ).toBeInTheDocument();
  });

  it("clamps an out-of-range deep link to the last slide", () => {
    slideParam = "99";
    render(<DeckShell slides={SLIDES} />);
    expect(
      screen.getByRole("heading", { name: /third slide/i })
    ).toBeInTheDocument();
  });

  it("disables the back arrow on the first slide and the forward arrow on the last", () => {
    slideParam = null;
    render(<DeckShell slides={SLIDES} />);
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeDisabled();

    slideParam = "3";
    render(<DeckShell slides={SLIDES} />);
    expect(
      screen.getAllByRole("button", { name: /next slide/i }).at(-1)
    ).toBeDisabled();
  });

  it("renders one progress dot per slide", () => {
    slideParam = null;
    render(<DeckShell slides={SLIDES} />);
    expect(screen.getByRole("button", { name: /go to slide 3/i })).toBeInTheDocument();
  });
});
