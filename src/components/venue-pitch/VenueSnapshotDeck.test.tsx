/**
 * Venue snapshot deck: five slides for a convention-center audience with
 * a non-financial posture — zero-cost promise, spec tiles instead of
 * prices, and a contact close instead of a rate card.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VenueSnapshotDeck } from "./VenueSnapshotDeck";

const replace = vi.fn();
let slideParam: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => slideParam }),
}));

describe("VenueSnapshotDeck", () => {
  it("opens on the cover addressed to the building", () => {
    slideParam = null;
    render(<VenueSnapshotDeck />);
    expect(
      screen.getByRole("heading", { level: 1, name: /your floor/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/installed, operated and removed by bright\.blue/i)
    ).toBeInTheDocument();
  });

  it("advances from the cover CTA", () => {
    slideParam = null;
    render(<VenueSnapshotDeck />);
    fireEvent.click(screen.getByRole("button", { name: /see how it works/i }));
    expect(replace).toHaveBeenCalledWith("?slide=2", { scroll: false });
  });

  it("leads the what-this-is story with the zero-lift promise", () => {
    slideParam = "2";
    render(<VenueSnapshotDeck />);
    expect(screen.getByText("We install, operate, maintain")).toBeInTheDocument();
    expect(screen.getByText("Sponsors fund every placement")).toBeInTheDocument();
    expect(screen.getByText("Zero cost. Zero operations.")).toBeInTheDocument();
  });

  it("shows the proof collage captioned for buildings", () => {
    slideParam = "3";
    render(<VenueSnapshotDeck />);
    expect(
      screen.getByRole("heading", { name: /buildings where this already works/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/conference foyer/i)).toBeInTheDocument();
  });

  it("frames the package as placement specs, never prices", () => {
    slideParam = "4";
    render(<VenueSnapshotDeck />);
    expect(
      screen.getByRole("heading", { name: /one square meter and a socket/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Cost to the building")).toBeInTheDocument();
    expect(
      screen.getByText(/nothing\. every placement is sponsor-funded/i)
    ).toBeInTheDocument();
    // Non-financial posture: no dollar figure anywhere on the slide.
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  it("closes on venue benefits with a contact action", () => {
    slideParam = "5";
    render(<VenueSnapshotDeck />);
    expect(
      screen.getByRole("heading", { name: /a better venue to book/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText("A differentiator in the sales deck")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start the conversation/i })
    ).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/)
    );
  });
});
