/** Tests for the stock telemetry card. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockTelemetryCard } from "./StockTelemetryCard";

describe("StockTelemetryCard", () => {
  it("shows remaining stock, progress and prizes dispensed", () => {
    render(
      <StockTelemetryCard
        stockRemaining={80}
        stockCapacity={100}
        totalPrizes={20}
      />,
    );

    expect(screen.getByText(/80 of 100 units remaining/i)).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText(/20/)).toBeInTheDocument();
    expect(screen.getByText(/prizes dispensed/i)).toBeInTheDocument();
  });

  it("uses amber styling under 25% and red under 15%", () => {
    const { rerender } = render(
      <StockTelemetryCard
        stockRemaining={20}
        stockCapacity={100}
        totalPrizes={80}
      />,
    );
    expect(document.querySelector(".\\[\\&\\>div\\]\\:bg-amber-500")).toBeTruthy();

    rerender(
      <StockTelemetryCard
        stockRemaining={10}
        stockCapacity={100}
        totalPrizes={90}
      />,
    );
    expect(document.querySelector(".\\[\\&\\>div\\]\\:bg-destructive")).toBeTruthy();
  });

  it("shows an honest empty state when capacity is unknown", () => {
    render(
      <StockTelemetryCard
        stockRemaining={null}
        stockCapacity={null}
        totalPrizes={0}
      />,
    );

    expect(
      screen.getByText(/no stock plan configured/i),
    ).toBeInTheDocument();
  });
});
