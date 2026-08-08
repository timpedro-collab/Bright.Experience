/** Live dashboard client — guards against numeric JSX short-circuit regressions. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@/test/render";

import { LiveDashboardClient } from "./LiveDashboardClient";

vi.mock("./HourlyChart", () => ({
  HourlyChart: () => <div>Hourly chart</div>,
}));

describe("LiveDashboardClient", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          source: "local",
          metrics: {
            total_plays: 0,
            total_leads: 0,
            total_interactions: 0,
            total_prizes: 0,
            avg_dwell_time: 0,
            stock_remaining: 0,
            stock_capacity: 100,
            reload_eta_minutes: 0,
          },
          hourly: [{ hour: 8, plays: 0, leads: 0 }],
          machines: [],
          machine_breakdown: [],
          zones: [],
          feed: [],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not render a stray 0 when the machine list is empty", () => {
    const { container } = render(
      <LiveDashboardClient
        eventId="e1"
        liveStatus={{ state: "ended" }}
        initialMetrics={{
          total_plays: 0,
          total_leads: 0,
          total_interactions: 0,
          total_prizes: 0,
          avg_dwell_time: 0,
          stock_remaining: null,
          stock_capacity: null,
          reload_eta_minutes: null,
        }}
        initialHourly={[{ hour: 8, plays: 0, leads: 0 }]}
        initialFeed={[]}
        initialMachines={[]}
      />,
    );

    expect(screen.getByText("No machines assigned")).toBeInTheDocument();

    const strayZeros = [...container.querySelectorAll("body *")].filter(
      (node) =>
        node.childNodes.length === 1 &&
        node.childNodes[0].nodeType === Node.TEXT_NODE &&
        node.textContent?.trim() === "0" &&
        !node.closest("svg"),
    );
    expect(strayZeros).toHaveLength(0);
  });

  it("skips the hourly chart when the event is not live", () => {
    render(
      <LiveDashboardClient
        eventId="e1"
        liveStatus={{ state: "ended" }}
        initialMetrics={{
          total_plays: 837,
          total_leads: 795,
          total_interactions: 1088,
          total_prizes: 820,
          avg_dwell_time: 29,
        }}
        initialHourly={[{ hour: 8, plays: 1, leads: 0 }]}
        initialFeed={[]}
        initialMachines={[]}
      />,
    );

    expect(screen.queryByText("Hourly chart")).not.toBeInTheDocument();
    expect(screen.queryByText("By the hour")).not.toBeInTheDocument();
  });

  it("swaps live chrome for final totals on an ended event", () => {
    render(
      <LiveDashboardClient
        eventId="e1"
        liveStatus={{ state: "ended" }}
        initialMetrics={{
          total_plays: 837,
          total_leads: 795,
          total_interactions: 1088,
          total_prizes: 820,
          avg_dwell_time: 29,
        }}
        initialHourly={[]}
        initialFeed={[]}
        initialMachines={[]}
      />,
    );

    expect(screen.getByText("The final numbers")).toBeInTheDocument();
    expect(screen.queryByText("Right now")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /live|paused/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Updated/)).not.toBeInTheDocument();
  });

  it("keeps the live polling chrome while the event is running", () => {
    render(
      <LiveDashboardClient
        eventId="e1"
        liveStatus={{ state: "live" }}
        initialMetrics={{
          total_plays: 10,
          total_leads: 4,
          total_interactions: 12,
          total_prizes: 2,
          avg_dwell_time: 30,
        }}
        initialHourly={[{ hour: 8, plays: 1, leads: 0 }]}
        initialFeed={[]}
        initialMachines={[]}
      />,
    );

    expect(screen.getByText("Right now")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /live/i })).toBeInTheDocument();
  });
});
