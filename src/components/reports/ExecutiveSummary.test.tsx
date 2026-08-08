/** Tests for the executive summary report tier. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecutiveSummary } from "./ExecutiveSummary";

const BASE = {
  totalPlays: 1200,
  totalLeads: 400,
  avgDwellSeconds: 45,
  totalCostPence: 1_200_000, // £12,000
  costPerLeadPence: 3000, // £30
};

describe("ExecutiveSummary", () => {
  it("shows engaged minutes, cost per lead, and cost per engaged minute", () => {
    render(<ExecutiveSummary {...BASE} />);

    // 1200 × 45s = 900 minutes
    expect(screen.getByText("Engaged minutes")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();

    expect(screen.getByText("Cost per lead")).toBeInTheDocument();
    expect(screen.getByText("£30.00")).toBeInTheDocument();

    // £12,000 / 900 min = 1333p
    expect(screen.getByText("Cost per engaged minute")).toBeInTheDocument();
    expect(screen.getByText("£13.33")).toBeInTheDocument();
  });

  it("renders benchmark verdict sentences when provided", () => {
    render(
      <ExecutiveSummary
        {...BASE}
        verdictSentences={["Plays 18% above the venue-class median"]}
      />,
    );
    expect(
      screen.getByText("Plays 18% above the venue-class median"),
    ).toBeInTheDocument();
  });

  it("omits cost per lead when spend is zero even if cpl prop is passed", () => {
    render(
      <ExecutiveSummary
        {...BASE}
        totalCostPence={0}
        costPerLeadPence={3000}
      />,
    );
    expect(screen.queryByText("Cost per lead")).not.toBeInTheDocument();
    expect(screen.queryByText("£30.00")).not.toBeInTheDocument();
  });

  it("omits cost per lead when leads are zero even if cpl prop is passed", () => {
    render(
      <ExecutiveSummary
        {...BASE}
        totalLeads={0}
        costPerLeadPence={3000}
      />,
    );
    expect(screen.queryByText("Cost per lead")).not.toBeInTheDocument();
    expect(screen.queryByText("£30.00")).not.toBeInTheDocument();
  });

  it("omits cost stats when there is no cost basis", () => {
    render(
      <ExecutiveSummary
        {...BASE}
        totalCostPence={0}
        costPerLeadPence={null}
      />,
    );
    expect(screen.getByText("Engaged minutes")).toBeInTheDocument();
    expect(screen.queryByText("Cost per lead")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Cost per engaged minute"),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when no stat is computable", () => {
    const { container } = render(
      <ExecutiveSummary
        totalPlays={0}
        totalLeads={0}
        avgDwellSeconds={null}
        totalCostPence={0}
        costPerLeadPence={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
