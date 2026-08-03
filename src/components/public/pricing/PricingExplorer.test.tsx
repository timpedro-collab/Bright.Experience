/** Tests for the audience-aware pricing explorer. */
import { describe, it, expect } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render, screen } from "@/test/render";
import { PricingExplorer } from "./PricingExplorer";

describe("PricingExplorer", () => {
  it("shows brands the tier grid in UK bands, Best tier first", () => {
    render(<PricingExplorer />);

    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual(["Command", "Lead Engine", "Showstopper", "Bespoke"]);

    expect(screen.getByText("£9,500–£13,500")).toBeInTheDocument();
    expect(screen.getByText("From £50,000")).toBeInTheDocument();
  });

  it("badges only the middle tier as most popular", () => {
    render(<PricingExplorer />);
    expect(screen.getAllByText("Most popular")).toHaveLength(1);
  });

  it("switches every band when the region changes", () => {
    render(<PricingExplorer />);

    fireEvent.click(screen.getByRole("button", { name: "US $" }));
    expect(screen.getByText("$32,000–$48,000")).toBeInTheDocument();
    expect(screen.queryByText("£9,500–£13,500")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "EU €" }));
    expect(screen.getByText("€18,000–€27,000")).toBeInTheDocument();
  });

  it("shows agencies the grid plus a trade-terms note", () => {
    render(<PricingExplorer />);

    fireEvent.click(screen.getByRole("button", { name: "I'm an agency" }));
    expect(screen.getByText(/Trade terms:/)).toBeInTheDocument();
    expect(screen.getByText("£9,500–£13,500")).toBeInTheDocument();
  });

  it("routes organizers to their partner page with no public numbers", () => {
    render(<PricingExplorer />);

    fireEvent.click(screen.getByRole("button", { name: "I run events" }));
    expect(screen.queryByText("£9,500–£13,500")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /See how organizers sell with us/ }),
    ).toHaveAttribute("href", "/for-organizers");
  });

  it("routes venues to their partner page with no public numbers", () => {
    render(<PricingExplorer />);

    fireEvent.click(screen.getByRole("button", { name: "I have a venue" }));
    expect(screen.queryByText("£9,500–£13,500")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /See what your venue could earn/ }),
    ).toHaveAttribute("href", "/for-venues");
  });

  it("respects a deep-linked initial persona", () => {
    render(<PricingExplorer initialPersona="venue" />);
    expect(
      screen.getByRole("link", { name: /See what your venue could earn/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("£9,500–£13,500")).not.toBeInTheDocument();
  });
});
