import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { EarningsSummary } from "./EarningsSummary";
import type { OrganizerEarnings } from "@/lib/queries/organizer-earnings";

const earnings: OrganizerEarnings = {
  slots: [],
  soldMarginPence: 500_000,
  pipelineMarginPence: 300_000,
  soldCount: 2,
  pipelineCount: 1,
};

describe("EarningsSummary", () => {
  it("renders earned, pipeline, and sold count figures", () => {
    render(<EarningsSummary earnings={earnings} />);

    expect(screen.getByText("Earned to date")).toBeInTheDocument();
    expect(screen.getByText("In pipeline")).toBeInTheDocument();
    expect(screen.getByText("Sponsorships sold")).toBeInTheDocument();
    expect(screen.getByText("£5,000")).toBeInTheDocument();
    expect(screen.getByText("£3,000")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("formats zero margins as currency rather than leaving blanks", () => {
    render(
      <EarningsSummary
        earnings={{
          ...earnings,
          soldMarginPence: 0,
          pipelineMarginPence: 0,
          soldCount: 0,
        }}
      />
    );

    expect(screen.getAllByText("£0")).toHaveLength(2);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
