import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { UnitReadinessCard } from "./UnitReadinessCard";
import { buildUnitReadiness } from "@/lib/metrics/unit-readiness";

describe("UnitReadinessCard", () => {
  it("leads with what the organizer still has to do", () => {
    render(<UnitReadinessCard items={buildUnitReadiness({})} />);

    expect(screen.getByText("2 things need you")).toBeInTheDocument();
    expect(screen.getAllByText("Needs you")).toHaveLength(2);
  });

  it("separates work sitting with Bright.Blue from the organizer's own", () => {
    render(<UnitReadinessCard items={buildUnitReadiness({})} />);

    expect(screen.getAllByText("With Bright.Blue")).toHaveLength(2);
  });

  it("shows the count and a progress bar the whole way for a ready unit", () => {
    render(
      <UnitReadinessCard
        items={buildUnitReadiness({
          zone: "Hall A",
          mission: "welcome_gift",
          config: { status: "tested", gameId: "g1", prizeCount: 200 },
          stockUnits: 900,
        })}
      />
    );

    expect(screen.getByText("Ready for the doors to open")).toBeInTheDocument();
    expect(screen.getByText("4 of 4 ready")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("links only the gaps the organizer can close themselves", () => {
    render(
      <UnitReadinessCard
        items={buildUnitReadiness({
          hrefs: { zone: "#deployment", configuration: "/config" },
        })}
      />
    );

    const links = screen.getAllByRole("link", { name: /sort this out/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "#deployment");
  });

  it("renders the timing hint under the headline", () => {
    render(
      <UnitReadinessCard
        items={buildUnitReadiness({})}
        timingHint="Opens in 100 days · Tech Live North"
      />
    );

    expect(
      screen.getByText("Opens in 100 days · Tech Live North")
    ).toBeInTheDocument();
  });

  it("states why an unsold unit needs nothing rather than hiding the row", () => {
    render(<UnitReadinessCard items={buildUnitReadiness({})} />);

    expect(
      screen.getByText(/Not offered for sale/)
    ).toBeInTheDocument();
  });
});
