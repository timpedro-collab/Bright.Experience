/** Tests for the live activity feed's relative timestamps and empty state. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { LiveFeed } from "./LiveFeed";

const NOW = new Date("2026-07-27T12:00:00Z");

function item(timestamp: string, overrides: Record<string, string> = {}) {
  return {
    id: `t-${timestamp}`,
    type: "lead",
    message: "New lead captured",
    timestamp,
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("LiveFeed", () => {
  it("explains an empty feed rather than showing a blank panel", () => {
    render(<LiveFeed items={[]} />);
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("reads recent activity as 'just now'", () => {
    vi.useFakeTimers({ now: NOW });
    render(<LiveFeed items={[item("2026-07-27T11:59:30Z")]} />);
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("never shows a negative age when a machine's clock runs ahead", () => {
    vi.useFakeTimers({ now: NOW });
    render(<LiveFeed items={[item("2026-07-27T12:00:20Z")]} />);
    expect(screen.getByText("just now")).toBeInTheDocument();
    expect(screen.queryByText(/-\d/)).not.toBeInTheDocument();
  });

  it("counts up through minutes, hours and days", () => {
    vi.useFakeTimers({ now: NOW });
    render(
      <LiveFeed
        items={[
          item("2026-07-27T11:30:00Z"),
          item("2026-07-27T09:00:00Z"),
          item("2026-07-25T12:00:00Z"),
        ]}
      />
    );
    expect(screen.getByText("30m ago")).toBeInTheDocument();
    expect(screen.getByText("3h ago")).toBeInTheDocument();
    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  it("filters rows to one machine when machineFilter is set", () => {
    render(
      <LiveFeed
        machineFilter="m1"
        items={[
          { ...item("2026-07-27T11:59:30Z"), id: "a", machineInstanceId: "m1" },
          { ...item("2026-07-27T11:58:30Z"), id: "b", machineInstanceId: "m2" },
        ]}
      />
    );
    expect(screen.getAllByText("New lead captured")).toHaveLength(1);
    expect(screen.queryByText("No activity for this machine yet")).not.toBeInTheDocument();
  });

  it("exposes a live-feed anchor for drill-down scroll targets", () => {
    render(<LiveFeed items={[]} />);
    expect(document.getElementById("live-feed")).toBeInTheDocument();
  });
});
