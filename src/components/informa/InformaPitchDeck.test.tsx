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
    slideParam = "11";
    render(<InformaPitchDeck />);
    expect(screen.getByText(/the ask/i)).toBeInTheDocument();
  });

  it("carries the two-model decision slide", () => {
    slideParam = "6";
    render(<InformaPitchDeck />);
    expect(
      screen.getByRole("heading", { name: /tampa demonstrates both/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/working pilot, not the commercial precedent/i)).toBeInTheDocument();
    expect(screen.getByText(/not inventory Informa sold for Tampa/i)).toBeInTheDocument();
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
    // Target cities render as chips naming their marquee shows — the US
    // and UK calendar, NRS Chicago included.
    expect(screen.getByText(/World of Concrete/)).toBeInTheDocument();
    expect(screen.getByText(/National Restaurant Show/)).toBeInTheDocument();
    // Wider-portfolio cities stay unlabeled dots: no chip, no text.
    expect(screen.queryByText(/Dubai/)).not.toBeInTheDocument();
  });

  it("carries the 2027 roadmap slide anchored by what is live today", () => {
    slideParam = "9";
    render(<InformaPitchDeck />);
    expect(
      screen.getByRole("heading", { name: /live today\. compounding through 2027/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Live lead dashboard")).toBeInTheDocument();
    expect(screen.getByText("CRM integrations")).toBeInTheDocument();
    // The anti-wait framing: releases land inside the existing agreement.
    expect(screen.getByText(/no new line on the order/i)).toBeInTheDocument();
  });

  it("carries the current slide on outbound links so back returns here", () => {
    slideParam = "8"; // renewal slide, which links to the sample report
    render(<InformaPitchDeck />);
    expect(
      screen.getByRole("link", { name: /open the sample report/i })
    ).toHaveAttribute("href", "/informa/report?slide=8");

    slideParam = "11"; // the ask, which links to the seller's kit
    render(<InformaPitchDeck />);
    expect(
      screen.getByRole("link", { name: /see what your reps get/i })
    ).toHaveAttribute("href", "/informa/kit?slide=11");
  });

  it("disables the back arrow on the first slide", () => {
    slideParam = null;
    render(<InformaPitchDeck />);
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeDisabled();
  });
});
