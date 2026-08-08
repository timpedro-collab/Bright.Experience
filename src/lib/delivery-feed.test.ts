import { describe, expect, it } from "vitest";

import { buildDeliveryFeed, buildStagedReveals } from "./delivery-feed";

const NOW = new Date(2026, 7, 1); // 1 Aug 2026

describe("buildDeliveryFeed", () => {
  it("shows wrap in progress during build_configuration", () => {
    const feed = buildDeliveryFeed({
      stage: "build_configuration",
      eventDateStart: "2026-08-20",
      venueName: "ExCeL London",
      now: NOW,
    });
    expect(feed).not.toBeNull();
    const byLabel = Object.fromEntries(feed!.map((i) => [i.label, i.state]));
    expect(byLabel["Booked in"]).toBe("done");
    expect(byLabel["Creative locked"]).toBe("done");
    expect(byLabel["Machine wrapped in your brand"]).toBe("active");
    expect(byLabel["Product-tested and dry-run"]).toBe("upcoming");
  });

  it("marks transit active only in the final two days once logistics are confirmed", () => {
    const far = buildDeliveryFeed({
      stage: "logistics_confirmed",
      eventDateStart: "2026-08-20",
      now: NOW,
    });
    expect(far!.at(-1)!.state).toBe("upcoming");

    const near = buildDeliveryFeed({
      stage: "logistics_confirmed",
      eventDateStart: "2026-08-02",
      venueName: "ExCeL London",
      now: NOW,
    });
    expect(near!.at(-1)).toMatchObject({
      label: "In transit to ExCeL London",
      state: "active",
    });
  });

  it("returns null before kickoff and once the event is live or past", () => {
    expect(
      buildDeliveryFeed({
        stage: "confirmed",
        eventDateStart: "2026-08-20",
        now: NOW,
      }),
    ).toBeNull();
    expect(
      buildDeliveryFeed({
        stage: "event_live",
        eventDateStart: "2026-08-01",
        now: NOW,
      }),
    ).toBeNull();
    expect(
      buildDeliveryFeed({
        stage: "logistics_confirmed",
        eventDateStart: "2026-07-20",
        now: NOW,
      }),
    ).toBeNull();
  });
});

describe("buildStagedReveals", () => {
  it("keeps everything locked more than 14 days out", () => {
    const reveals = buildStagedReveals({
      eventDateStart: "2026-09-30",
      now: NOW,
    });
    expect(reveals!.every((r) => !r.unlocked)).toBe(true);
    expect(reveals![0].unlocksLabel).toBe("Unlocks 14 days out");
  });

  it("unlocks the wrap at T-14 but keeps the game locked until T-7", () => {
    const reveals = buildStagedReveals({
      eventDateStart: "2026-08-11", // 10 days out
      now: NOW,
    });
    const byKey = Object.fromEntries(reveals!.map((r) => [r.key, r.unlocked]));
    expect(byKey).toEqual({ wrap: true, game: false, loadout: false });
  });

  it("unlocks everything the day before, naming the venue in the load-out card", () => {
    const reveals = buildStagedReveals({
      eventDateStart: "2026-08-02",
      venueName: "ExCeL London",
      now: NOW,
    });
    expect(reveals!.every((r) => r.unlocked)).toBe(true);
    expect(reveals!.find((r) => r.key === "loadout")!.body).toContain(
      "ExCeL London",
    );
  });

  it("returns null once the event has started", () => {
    expect(
      buildStagedReveals({ eventDateStart: "2026-07-25", now: NOW }),
    ).toBeNull();
  });
});
