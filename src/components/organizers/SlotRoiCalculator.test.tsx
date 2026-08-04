/** Tests for the sponsor pitch cost-per-lead mini-calculator. */
import { describe, it, expect } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render, screen } from "@/test/render";
import { SlotRoiCalculator } from "./SlotRoiCalculator";

describe("SlotRoiCalculator", () => {
  it("seeds the lead input to the midpoint of the benchmark range", () => {
    render(
      <SlotRoiCalculator pricePence={1_500_000} leadsLow={250} leadsHigh={350} />,
    );

    expect(screen.getByLabelText("Leads you expect")).toHaveValue(300);
    expect(screen.getByText("What this works out to")).toBeInTheDocument();
    expect(screen.getByText("£50", { exact: false })).toBeInTheDocument();
  });

  it("recomputes cost per lead when the input changes", () => {
    render(
      <SlotRoiCalculator pricePence={1_500_000} leadsLow={250} leadsHigh={350} />,
    );

    fireEvent.change(screen.getByLabelText("Leads you expect"), {
      target: { value: "500" },
    });

    expect(screen.getByText(/£30/)).toBeInTheDocument();
    expect(screen.queryByText(/£50/)).not.toBeInTheDocument();
  });

  it("renders the benchmark range line with both lead and CPL bounds", () => {
    render(
      <SlotRoiCalculator pricePence={1_500_000} leadsLow={250} leadsHigh={350} />,
    );

    expect(
      screen.getByText(
        "Comparable slots capture 250–350 leads — that's £43 to £60 per lead.",
      ),
    ).toBeInTheDocument();
  });

  it("renders nothing when the slot has no price", () => {
    render(<SlotRoiCalculator pricePence={0} leadsLow={250} leadsHigh={350} />);

    expect(screen.queryByText("What this works out to")).not.toBeInTheDocument();
  });
});
