import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditionPlate } from "./edition-plate";

describe("EditionPlate", () => {
  it("renders title, location metadata, and status", () => {
    render(
      <EditionPlate
        id="evt-024"
        title="Acme · Spring"
        meta="Westfield London"
        statusLabel="In production"
      />,
    );
    expect(screen.getByText("Acme · Spring")).toBeInTheDocument();
    expect(screen.getByText("Westfield London")).toBeInTheDocument();
    expect(screen.getByText("In production")).toBeInTheDocument();
  });

  it("renders as a link when href is set", () => {
    render(<EditionPlate id="evt-1" title="Linked" href="/events/evt-1" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/events/evt-1");
  });

  it("shows the 'Waiting on you' badge when requested", () => {
    render(
      <EditionPlate
        id="evt-1"
        title="Hello"
        waitingOnYou
        statusLabel="Awaiting client"
      />,
    );
    expect(screen.getByText("Waiting on you")).toBeInTheDocument();
  });

  it("renders the ridge artwork SVG", () => {
    const { container } = render(<EditionPlate id="evt-1" title="X" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
