import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { BenchmarkContextCard } from "./BenchmarkContext";
import type { BenchmarkContext } from "@/lib/queries/benchmark-context";
import type { BenchmarkVerdict } from "@/lib/metrics/benchmark-compare";

const PLAYS_VERDICT: BenchmarkVerdict = {
  metric: "plays",
  label: "Plays",
  value: 300,
  reference: 250,
  deltaPct: 20,
  direction: "above",
  sentence: "20% above the venue-class median",
};

const LEADS_VERDICT: BenchmarkVerdict = {
  metric: "leads",
  label: "Leads captured",
  value: 45,
  reference: 50,
  deltaPct: -10,
  direction: "below",
  sentence: "10% below your last event",
};

describe("BenchmarkContextCard", () => {
  it("renders both comparison groups when context is available", () => {
    const context: BenchmarkContext = {
      lastEvent: {
        eventName: "Spring Show",
        verdicts: [LEADS_VERDICT],
      },
      venueClass: {
        sampleSize: 12,
        verdicts: [PLAYS_VERDICT],
      },
    };

    render(<BenchmarkContextCard context={context} />);

    expect(screen.getByText("In context")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "vs your last event — Spring Show" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "vs venues like this one (n = 12)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Leads captured")).toBeInTheDocument();
    expect(screen.getByText("10% below your last event")).toBeInTheDocument();
    expect(screen.getByText("20% above the venue-class median")).toBeInTheDocument();
  });

  it("renders nothing when both groups are empty", () => {
    const { container } = render(
      <BenchmarkContextCard context={{ lastEvent: null, venueClass: null }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the small-sample caveat when n is below five", () => {
    render(
      <BenchmarkContextCard
        context={{
          lastEvent: null,
          venueClass: { sampleSize: 3, verdicts: [PLAYS_VERDICT] },
        }}
      />,
    );

    expect(
      screen.getByText("Early data — treat as directional."),
    ).toBeInTheDocument();
  });

  it("hides the small-sample caveat when n is five or more", () => {
    render(
      <BenchmarkContextCard
        context={{
          lastEvent: null,
          venueClass: { sampleSize: 5, verdicts: [PLAYS_VERDICT] },
        }}
      />,
    );

    expect(
      screen.queryByText("Early data — treat as directional."),
    ).not.toBeInTheDocument();
  });
});
