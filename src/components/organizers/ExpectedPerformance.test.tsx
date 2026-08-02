import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ExpectedPerformance } from "./ExpectedPerformance";
import type { Expectation } from "@/lib/metrics/expected-performance";

const PLAYS: Expectation = {
  metric: "plays",
  perDayLow: 250,
  perDayHigh: 300,
  totalLow: 750,
  totalHigh: 900,
  sampleSize: 28,
  basis: "machine",
};

const LEADS: Expectation = {
  metric: "leads",
  perDayLow: 185,
  perDayHigh: 240,
  totalLow: 555,
  totalHigh: 720,
  sampleSize: 28,
  basis: "machine",
};

describe("ExpectedPerformance", () => {
  it("shows a daily range and the whole-show total", () => {
    render(<ExpectedPerformance plays={PLAYS} leads={LEADS} days={3} />);

    expect(screen.getByText("250–300")).toBeInTheDocument();
    expect(screen.getByText(/750–900 across 3 days/)).toBeInTheDocument();
  });

  it("names the sample behind the range so it reads as evidence", () => {
    render(<ExpectedPerformance plays={PLAYS} leads={LEADS} days={3} />);

    expect(
      screen.getByText(/Based on 28 comparable activations with this machine/)
    ).toBeInTheDocument();
  });

  it("calls it a range rather than a promise", () => {
    render(<ExpectedPerformance plays={PLAYS} leads={null} days={1} />);

    expect(screen.getByText(/not a promise/)).toBeInTheDocument();
  });

  it("drops the multi-day total for a one-day show", () => {
    render(<ExpectedPerformance plays={PLAYS} leads={null} days={1} />);

    expect(screen.queryByText(/across/)).not.toBeInTheDocument();
  });

  it("renders nothing at all when we hold no comparable data", () => {
    const { container } = render(
      <ExpectedPerformance plays={null} leads={null} days={3} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
