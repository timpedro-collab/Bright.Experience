import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FleetLiveClient } from "./FleetLiveClient";
import { buildMachineBreakdown } from "@/lib/metrics/fleet";

const EVENT_ID = "e7777777-7777-7777-7777-777777777777";
const HREF_BASE = `/organizers/informa/shows/${EVENT_ID}/machines`;

const FRESH = new Date(Date.now() - 30_000).toISOString();

const LIVE_FLEET = buildMachineBreakdown(
  [
    {
      id: "m1",
      serial_number: "BV-1",
      nickname: "Registration North",
      zone: "Registration",
      mission: "welcome_gift",
      last_heartbeat: FRESH,
    },
    {
      id: "m2",
      serial_number: "BV-2",
      nickname: "Hall 3 Stand",
      zone: "Hall 3",
      mission: "sponsor_activation",
      last_heartbeat: FRESH,
    },
  ],
  [
    { machine_instance_id: "m1", event_type: "play_started" },
    { machine_instance_id: "m1", event_type: "lead_captured" },
    { machine_instance_id: "m2", event_type: "play_started" },
  ]
);

const PREP_FLEET = buildMachineBreakdown(
  [
    { id: "p1", serial_number: "BV-9", nickname: "Manchester unit 1", zone: "Registration" },
    { id: "p2", serial_number: "BV-10", nickname: "Manchester unit 2" },
  ],
  []
);

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("FleetLiveClient", () => {
  it("shows fleet totals that match the sum of the units", () => {
    render(
      <FleetLiveClient
        eventId={EVENT_ID}
        initialBreakdown={LIVE_FLEET}
        machineHrefBase={HREF_BASE}
      />
    );
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("Whole fleet reporting in")).toBeInTheDocument();
    expect(screen.getByText("50% of plays opted in")).toBeInTheDocument();
  });

  it("links each unit to its own page", () => {
    render(
      <FleetLiveClient
        eventId={EVENT_ID}
        initialBreakdown={LIVE_FLEET}
        machineHrefBase={HREF_BASE}
      />
    );
    expect(
      screen.getByRole("link", { name: /Registration North/ })
    ).toHaveAttribute("href", `${HREF_BASE}/m1`);
  });

  it("picks up a unit dropping offline on the next poll", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          machine_breakdown: [
            LIVE_FLEET[0],
            { ...LIVE_FLEET[1], is_online: false },
          ],
        }),
      })
    );

    render(
      <FleetLiveClient
        eventId={EVENT_ID}
        initialBreakdown={LIVE_FLEET}
        machineHrefBase={HREF_BASE}
      />
    );

    expect(screen.getByText("Whole fleet reporting in")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(15_000);
    await waitFor(() => {
      expect(screen.getByText("1 not reporting in")).toBeInTheDocument();
    });
  });

  it("stops polling when the reader pauses it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ machine_breakdown: LIVE_FLEET }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <FleetLiveClient
        eventId={EVENT_ID}
        initialBreakdown={LIVE_FLEET}
        machineHrefBase={HREF_BASE}
      />
    );

    await user.click(screen.getByRole("button", { name: /Live/ }));
    await vi.advanceTimersByTimeAsync(45_000);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("reports readiness instead of signal before a show opens", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <FleetLiveClient
        eventId={EVENT_ID}
        initialBreakdown={PREP_FLEET}
        machineHrefBase={HREF_BASE}
        isLive={false}
        dormantLabel="Opens 13 Dec"
      />
    );

    await vi.advanceTimersByTimeAsync(60_000);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Opens 13 Dec")).toBeInTheDocument();
    expect(screen.getByText("Readiness")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
    expect(screen.getByText("2 still need a zone or a job")).toBeInTheDocument();
    expect(screen.queryByText(/not reporting in/)).not.toBeInTheDocument();
    // No zeroed live counters, but the reader is told where they'll show up.
    expect(screen.queryByText("Plays")).not.toBeInTheDocument();
    expect(screen.getByText(/appear here the moment the doors open/)).toBeInTheDocument();
  });
});
