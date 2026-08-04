/** Tests for the lead quality summary card. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadQualityCard } from "./LeadQualityCard";
import type { LeadQualitySummary } from "@/lib/queries/lead-quality";

const BASE_SUMMARY: LeadQualitySummary = {
  total: 12,
  verified: 7,
  unchecked: 1,
  disposable: 2,
  invalid: 1,
  repeatPlayers: 3,
};

describe("LeadQualityCard", () => {
  it("renders the verified headline count from the summary", () => {
    render(<LeadQualityCard summary={BASE_SUMMARY} />);

    expect(
      screen.getByLabelText("7 verified leads"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /verified leads — deduped, syntax-checked, no disposable domains/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the breakdown rows with em-dash zero states", () => {
    render(
      <LeadQualityCard
        summary={{
          total: 4,
          verified: 2,
          unchecked: 0,
          disposable: 0,
          invalid: 0,
          repeatPlayers: 1,
        }}
      />,
    );

    const rows = screen.getAllByRole("term");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Total captured",
      "Repeat players (deduped out)",
      "Disposable domains",
      "Invalid addresses",
      "Awaiting check (unchecked)",
    ]);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("shows the empty state when total is zero", () => {
    render(
      <LeadQualityCard
        summary={{
          total: 0,
          verified: 0,
          unchecked: 0,
          disposable: 0,
          invalid: 0,
          repeatPlayers: 0,
        }}
      />,
    );

    expect(screen.getByText("Lead quality")).toBeInTheDocument();
    expect(screen.getByText("No leads captured yet.")).toBeInTheDocument();
    expect(screen.queryByRole("term")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/verified leads — deduped/i),
    ).not.toBeInTheDocument();
  });

  it("notes when every lead is still awaiting screening", () => {
    render(
      <LeadQualityCard
        summary={{
          total: 3,
          verified: 0,
          unchecked: 3,
          disposable: 0,
          invalid: 0,
          repeatPlayers: 0,
        }}
      />,
    );

    expect(
      screen.getByText("Quality screening runs as leads arrive."),
    ).toBeInTheDocument();
  });

  it("omits the screening note once any lead has been checked", () => {
    render(<LeadQualityCard summary={BASE_SUMMARY} />);

    expect(
      screen.queryByText("Quality screening runs as leads arrive."),
    ).not.toBeInTheDocument();
  });
});
