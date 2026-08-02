import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ShowReadinessBoard } from "./ShowReadinessBoard";
import {
  showReadinessRows,
  type ShowReadinessContext,
} from "@/lib/metrics/show-readiness";

const CONTEXT: ShowReadinessContext = {
  gameConfigs: [
    {
      machineInstanceId: null,
      status: "tested",
      gameId: "g1",
      prizesJson: [{ quantity: 300 }],
    },
  ],
  productConfigs: [{ machineInstanceId: null, totalUnits: 800 }],
  slots: [],
};

const ROWS = showReadinessRows(
  [
    { id: "m1", label: "Registration unit", zone: "Hall A", mission: "welcome_gift" },
    { id: "m2", label: "Spare unit", zone: null, mission: null },
  ],
  CONTEXT
);

describe("ShowReadinessBoard", () => {
  it("summarises the show in one line", () => {
    render(<ShowReadinessBoard rows={ROWS} machineHrefBase="/units" />);

    expect(
      screen.getByText("1 of 2 units ready · 2 things need you")
    ).toBeInTheDocument();
  });

  it("names what an outstanding unit is missing rather than a bare count", () => {
    render(<ShowReadinessBoard rows={ROWS} machineHrefBase="/units" />);

    expect(
      screen.getByText(/needs where it stands, what it's here to do/i)
    ).toBeInTheDocument();
  });

  it("marks a prepared unit as ready", () => {
    render(<ShowReadinessBoard rows={ROWS} machineHrefBase="/units" />);

    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("links every unit to its own page", () => {
    render(<ShowReadinessBoard rows={ROWS} machineHrefBase="/units" />);

    expect(screen.getByRole("link", { name: "Spare unit" })).toHaveAttribute(
      "href",
      "/units/m2"
    );
  });

  it("renders nothing for a show with no units", () => {
    const { container } = render(
      <ShowReadinessBoard rows={[]} machineHrefBase="/units" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
