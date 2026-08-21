/**
 * Informa snapshot deck: five slides, minimal text, numbers straight from
 * the rate card and deal config, and links deeper into the suite.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InformaSnapshotDeck } from "./InformaSnapshotDeck";

const replace = vi.fn();
let slideParam: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => slideParam }),
}));

describe("InformaSnapshotDeck", () => {
  it("opens on the cover with the five-slide promise", () => {
    slideParam = null;
    render(<InformaSnapshotDeck />);
    expect(
      screen.getByRole("heading", { level: 1, name: /new inventory/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/the whole story in five slides/i)).toBeInTheDocument();
  });

  it("advances from the cover CTA", () => {
    slideParam = null;
    render(<InformaSnapshotDeck />);
    fireEvent.click(screen.getByRole("button", { name: /see it in five/i }));
    expect(replace).toHaveBeenCalledWith("?slide=2", { scroll: false });
  });

  it("tells the what-this-is story in four statements", () => {
    slideParam = "2";
    render(<InformaSnapshotDeck />);
    expect(screen.getByText("Sponsor-branded machines")).toBeInTheDocument();
    expect(screen.getByText("Badge scan to play")).toBeInTheDocument();
    expect(screen.getByText("Proof in 24 hours")).toBeInTheDocument();
    expect(screen.getByText("We deliver. You sell.")).toBeInTheDocument();
  });

  it("shows the proof collage with real activation photography", () => {
    slideParam = "3";
    render(<InformaSnapshotDeck />);
    expect(
      screen.getByRole("heading", { name: /live brands\. live floors\./i })
    ).toBeInTheDocument();
    expect(screen.getByText(/pepsi/i)).toBeInTheDocument();
    expect(screen.getByAltText(/wrapped adyen machine/i)).toBeInTheDocument();
  });

  it("carries all five rate-card products with their bands", () => {
    slideParam = "4";
    render(<InformaSnapshotDeck />);
    expect(screen.getByText("Registration Takeover")).toBeInTheDocument();
    expect(screen.getByText("Show-Floor Takeover")).toBeInTheDocument();
    expect(screen.getByText("In-Booth Machine")).toBeInTheDocument();
    expect(screen.getByText("Rebooking Engine")).toBeInTheDocument();
    expect(screen.getByText("Screen Ad Network")).toBeInTheDocument();
    // The In-Booth band as set in products.ts.
    expect(
      screen.getByText("$45,000 to $60,000 per show")
    ).toBeInTheDocument();
  });

  it("closes on the retained-share story with the worked pilot mix", () => {
    slideParam = "5";
    render(<InformaSnapshotDeck />);
    expect(
      screen.getByRole("heading", { name: /30% of every sale is yours to keep/i })
    ).toBeInTheDocument();
    // Worked pilot numbers derive from the live deal config.
    expect(screen.getByText("$500,000")).toBeInTheDocument();
    expect(screen.getByText("$150,000")).toBeInTheDocument();
  });

  it("links deeper into the suite but never to the private calculator", () => {
    slideParam = "5";
    render(<InformaSnapshotDeck />);
    expect(
      screen.getByRole("link", { name: /full partnership deck/i })
    ).toHaveAttribute("href", "/informa");
    expect(
      screen.getByRole("link", { name: /seller's kit/i })
    ).toHaveAttribute("href", "/informa/kit");
    expect(
      screen.getByRole("link", { name: /sample proof-of-performance report/i })
    ).toHaveAttribute("href", "/informa/report");
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href")?.startsWith("/pp"))).toBe(false);
  });
});
