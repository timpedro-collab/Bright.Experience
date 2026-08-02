import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { MachineLiveClient } from "./MachineLiveClient";
import type { MachineBreakdown } from "@/lib/metrics/fleet";

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const MINE = "aaaaaaaa-1111-1111-1111-111111111111";
const OTHER = "bbbbbbbb-1111-1111-1111-111111111111";

const STATS: MachineBreakdown = {
  machine_instance_id: MINE,
  serial_number: "BB-0001",
  nickname: "Registration North",
  zone: "Registration",
  mission: "welcome_gift",
  status: "deployed",
  last_heartbeat: "2026-07-27T09:00:00Z",
  is_online: true,
  plays: 10,
  leads: 5,
  prizes: 2,
  rejected: 0,
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderClient(feed = [] as Parameters<typeof MachineLiveClient>[0]["initialFeed"]) {
  return render(
    <MachineLiveClient
      eventId={EVENT_ID}
      machineInstanceId={MINE}
      initialStats={STATS}
      initialFeed={feed}
    />
  );
}

describe("MachineLiveClient", () => {
  it("shows the opt-in rate rather than leaving the reader to divide", () => {
    renderClient();
    expect(screen.getByText("50% of plays opted in")).toBeInTheDocument();
  });

  it("polls the show endpoint and keeps only this unit's numbers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        machine_breakdown: [
          { ...STATS, plays: 44 },
          { ...STATS, machine_instance_id: OTHER, plays: 999 },
        ],
        feed: [],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderClient();
    await vi.advanceTimersByTimeAsync(15_000);

    await waitFor(() => {
      expect(screen.getByText("44")).toBeInTheDocument();
    });
    expect(screen.queryByText("999")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/events/${EVENT_ID}/live`,
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("keeps the rendered history when a busy neighbour crowds this unit out of the feed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        machine_breakdown: [STATS],
        feed: [
          {
            id: "t9",
            type: "play",
            message: "Game completed",
            timestamp: "2026-07-27T09:05:00Z",
            machineInstanceId: OTHER,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderClient([
      {
        id: "t1",
        type: "lead",
        message: "New lead captured",
        timestamp: "2026-07-27T09:00:00Z",
        machineInstanceId: MINE,
      },
    ]);

    await vi.advanceTimersByTimeAsync(15_000);

    await waitFor(() => {
      expect(screen.getByText("New lead captured")).toBeInTheDocument();
    });
    expect(screen.queryByText("Game completed")).not.toBeInTheDocument();
  });

  it("survives the endpoint failing without blanking the panel", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderClient();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(screen.getByText("50% of plays opted in")).toBeInTheDocument();
  });

  it("does not poll a show that hasn't opened, and says when it does", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MachineLiveClient
        eventId={EVENT_ID}
        machineInstanceId={MINE}
        initialStats={{ ...STATS, plays: 0, leads: 0 }}
        initialFeed={[]}
        isLive={false}
        dormantLabel="Opens 13 Dec"
      />
    );

    await vi.advanceTimersByTimeAsync(60_000);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Opens 13 Dec")).toBeInTheDocument();
    expect(screen.getByText("At this unit")).toBeInTheDocument();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });

  it("omits the opt-in hint when nobody has played yet", () => {
    render(
      <MachineLiveClient
        eventId={EVENT_ID}
        machineInstanceId={MINE}
        initialStats={{ ...STATS, plays: 0, leads: 0 }}
        initialFeed={[]}
      />
    );
    expect(screen.queryByText(/opted in/)).not.toBeInTheDocument();
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });
});
