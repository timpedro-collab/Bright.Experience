/** Tests for the cost-per-lead calculator on the business-case page. */
import { describe, it, expect } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render, screen } from "@/test/render";
import { CplCalculator } from "./CplCalculator";

describe("CplCalculator", () => {
  it("shows per-lead cost for the lead-capturing tiers only", () => {
    render(<CplCalculator />);

    // Lead Engine £16,000–£24,000 at 300 leads → £53–£80.
    expect(screen.getByText("Lead Engine")).toBeInTheDocument();
    expect(screen.getByText("Command")).toBeInTheDocument();
    expect(screen.queryByText("Showstopper")).not.toBeInTheDocument();
    expect(screen.getByText(/£53–£80/)).toBeInTheDocument();
  });

  it("recomputes when the lead count changes", () => {
    render(<CplCalculator />);

    fireEvent.change(screen.getByLabelText(/Opted-in leads/), {
      target: { value: "600" },
    });
    // £16,000–£24,000 at 600 leads → £27–£40.
    expect(screen.getByText(/£27–£40/)).toBeInTheDocument();
    expect(screen.queryByText(/£53–£80/)).not.toBeInTheDocument();
  });

  it("switches currency with the region", () => {
    render(<CplCalculator />);

    fireEvent.click(screen.getByRole("button", { name: "US $" }));
    // Lead Engine $32,000–$48,000 at 300 leads → $107–$160.
    expect(screen.getByText(/\$107–\$160/)).toBeInTheDocument();
  });

  it("names the external benchmarks it compares against", () => {
    render(<CplCalculator />);
    expect(screen.getByText("Trade-show average (CEIR)")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn Lead Gen ads")).toBeInTheDocument();
  });
});
