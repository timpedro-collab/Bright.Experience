import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { KeyDates } from "./KeyDates";
import { buildShowSchedule } from "@/lib/metrics/show-schedule";

const ENTRIES = buildShowSchedule({
  setupDate: "2026-11-09",
  startDate: "2026-11-10",
  endDate: "2026-11-12",
  collectionDate: "2026-11-13",
  today: "2026-11-10",
});

describe("KeyDates", () => {
  it("runs from install through to collection", () => {
    render(<KeyDates entries={ENTRIES} />);

    expect(screen.getByText("Install")).toBeInTheDocument();
    expect(screen.getByText("Doors open")).toBeInTheDocument();
    expect(screen.getByText("Show closes")).toBeInTheDocument();
    expect(screen.getByText("Collection")).toBeInTheDocument();
  });

  it("answers 'how long have I got' beside every date", () => {
    render(<KeyDates entries={ENTRIES} />);

    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("In 2 days")).toBeInTheDocument();
  });

  it("renders nothing when the event carries no dates at all", () => {
    const { container } = render(<KeyDates entries={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
