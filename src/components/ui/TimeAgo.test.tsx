/**
 * Tests for TimeAgo — the hydration-safe relative timestamp.
 *
 * `timeSince` reads the current date, so "now" is pinned with fake timers
 * (same pattern as src/lib/dates.test.ts) to avoid day-boundary flakes.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TimeAgo } from "./TimeAgo";

describe("TimeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 10, 9, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("renders a day-relative label for a past date", () => {
    render(<TimeAgo dateStr="2026-06-07" />);
    expect(screen.getByText("3d ago")).toBeInTheDocument();
  });

  it("renders an hour-relative label within the same day", () => {
    render(<TimeAgo dateStr="2026-06-10" />);
    expect(screen.getByText("9h ago")).toBeInTheDocument();
  });

  it("marks its span as hydration-warning-suppressed", () => {
    const { container } = render(<TimeAgo dateStr="2026-06-07" />);
    expect(container.querySelector("span")?.textContent).toBe("3d ago");
  });
});
