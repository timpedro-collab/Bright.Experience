/** Tests for the customer-facing multi-event volume ladder card. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { VolumeLadderCard } from "./VolumeLadderCard";

describe("VolumeLadderCard", () => {
  it("renders all three rungs with laddered fees for a known base", () => {
    render(<VolumeLadderCard baseFeePence={1_000_000} />);

    expect(
      screen.getByRole("heading", { name: /planning more than one activation/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("First activation")).toBeInTheDocument();
    expect(screen.getByText("Events 2–3")).toBeInTheDocument();
    expect(screen.getByText("Events 4+")).toBeInTheDocument();
    expect(screen.getByText("£10,000")).toBeInTheDocument();
    expect(screen.getByText("£9,500")).toBeInTheDocument();
    expect(screen.getByText("£9,000")).toBeInTheDocument();
  });

  it("renders an em-dash instead of 0% on the first rung", () => {
    const { container } = render(<VolumeLadderCard baseFeePence={1_000_000} />);

    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label="No saving"]')).toHaveTextContent(
      "—",
    );
  });

  it("renders nothing for a zero base fee", () => {
    render(<VolumeLadderCard baseFeePence={0} />);

    expect(
      screen.queryByRole("heading", { name: /planning more than one activation/i }),
    ).not.toBeInTheDocument();
  });
});
