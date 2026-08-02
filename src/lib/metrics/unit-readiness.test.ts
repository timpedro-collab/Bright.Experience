import { describe, it, expect } from "vitest";

import {
  buildUnitReadiness,
  readinessProgress,
  readinessHeadline,
  type ReadinessItem,
  type ReadinessItemId,
} from "./unit-readiness";

/** A unit with nothing done, as it arrives the day it is allocated to a show. */
const BARE = {} as const;

/** Everything settled: placed, given a job, built, stocked, sold, artwork in. */
const READY = {
  zone: "Hall A",
  mission: "sponsor_activation" as const,
  config: { status: "tested", gameId: "game-1", prizeCount: 600 },
  stockUnits: 1800,
  slot: {
    sponsorName: "Salesforce",
    status: "reserved",
    creativeCount: 1,
    creativeApproved: 1,
  },
};

function item(items: ReadinessItem[], id: ReadinessItemId): ReadinessItem {
  const found = items.find((i) => i.id === id);
  if (!found) throw new Error(`no readiness item for ${id}`);
  return found;
}

describe("buildUnitReadiness", () => {
  it("flags an unplaced unit with no job as the organizer's to do", () => {
    const items = buildUnitReadiness(BARE);

    expect(item(items, "zone").state).toBe("todo");
    expect(item(items, "zone").owner).toBe("organizer");
    expect(item(items, "mission").state).toBe("todo");
    expect(item(items, "mission").owner).toBe("organizer");
  });

  it("reports the zone and mission back once they are set", () => {
    const items = buildUnitReadiness({ zone: "Hall A", mission: "welcome_gift" });

    expect(item(items, "zone")).toMatchObject({ state: "done", detail: "Hall A" });
    expect(item(items, "mission")).toMatchObject({
      state: "done",
      detail: "Welcome gift",
    });
  });

  it("treats a whitespace-only zone as no zone at all", () => {
    const items = buildUnitReadiness({ zone: "   " });
    expect(item(items, "zone").state).toBe("todo");
  });

  it("counts a tested configuration as done and an in-flight one as waiting on us", () => {
    const tested = buildUnitReadiness({
      config: { status: "tested", gameId: "game-1", prizeCount: 120 },
    });
    expect(item(tested, "configuration")).toMatchObject({
      state: "done",
      owner: "brightblue",
    });
    expect(item(tested, "configuration").detail).toContain("120 prizes");

    const submitted = buildUnitReadiness({
      config: { status: "submitted", gameId: "game-1", prizeCount: 0 },
    });
    expect(item(submitted, "configuration").state).toBe("waiting");
  });

  it("treats a configuration with no game chosen as unbuilt", () => {
    const items = buildUnitReadiness({
      config: { status: "configured", gameId: null, prizeCount: 0 },
    });
    expect(item(items, "configuration").state).toBe("waiting");
    expect(item(items, "configuration").detail).toContain("Game still to be chosen");
  });

  it("excuses stock on a screen-only unit rather than reporting a gap", () => {
    const kiosk = buildUnitReadiness({ dispensesProduct: false });
    expect(item(kiosk, "stock").state).toBe("optional");

    const portal = buildUnitReadiness({ dispensesProduct: true });
    expect(item(portal, "stock").state).toBe("waiting");
  });

  it("reads an unsold unit as an opportunity, not an outstanding task", () => {
    const items = buildUnitReadiness(BARE);
    expect(item(items, "sponsor").state).toBe("optional");
    expect(item(items, "creative").state).toBe("optional");
  });

  it("asks the organizer to fill an open slot they have already opened", () => {
    const items = buildUnitReadiness({
      slot: {
        sponsorName: null,
        status: "available",
        creativeCount: 0,
        creativeApproved: 0,
      },
    });
    expect(item(items, "sponsor").state).toBe("todo");
    // Nobody to chase artwork from yet.
    expect(item(items, "creative").state).toBe("optional");
  });

  it("chases the sponsor for missing artwork and us for artwork in review", () => {
    const missing = buildUnitReadiness({
      slot: { sponsorName: "EE", status: "reserved", creativeCount: 0, creativeApproved: 0 },
    });
    expect(item(missing, "creative")).toMatchObject({
      state: "todo",
      owner: "organizer",
    });
    expect(item(missing, "creative").detail).toContain("EE");

    const inReview = buildUnitReadiness({
      slot: { sponsorName: "EE", status: "reserved", creativeCount: 2, creativeApproved: 1 },
    });
    expect(item(inReview, "creative")).toMatchObject({
      state: "waiting",
      owner: "brightblue",
    });
    expect(item(inReview, "creative").detail).toContain("1 of 2");
  });

  it("attaches the deep link for each gap when one is supplied", () => {
    const items = buildUnitReadiness({
      hrefs: { zone: "/deploy", configuration: "/config" },
    });
    expect(item(items, "zone").href).toBe("/deploy");
    expect(item(items, "configuration").href).toBe("/config");
    expect(item(items, "mission").href).toBeUndefined();
  });
});

describe("readinessProgress", () => {
  it("reports a fully prepared unit as ready", () => {
    const progress = readinessProgress(buildUnitReadiness(READY));

    expect(progress.isReady).toBe(true);
    expect(progress.done).toBe(progress.total);
    expect(progress.organizerTodo).toHaveLength(0);
    expect(progress.waitingOnUs).toHaveLength(0);
  });

  it("leaves optional items out of the count so a sold-nothing unit can still be ready", () => {
    const progress = readinessProgress(
      buildUnitReadiness({
        zone: "Registration",
        mission: "welcome_gift",
        config: { status: "tested", gameId: "game-1", prizeCount: 400 },
        stockUnits: 900,
      })
    );

    // Sponsor and artwork are optional here, so four items count and all pass.
    expect(progress.total).toBe(4);
    expect(progress.isReady).toBe(true);
  });

  it("splits what the organizer owns from what sits with us", () => {
    const progress = readinessProgress(buildUnitReadiness(BARE));

    expect(progress.organizerTodo.map((i) => i.id)).toEqual(["zone", "mission"]);
    expect(progress.waitingOnUs.map((i) => i.id)).toEqual(["configuration", "stock"]);
    expect(progress.isReady).toBe(false);
  });
});

describe("readinessHeadline", () => {
  it("leads with the organizer's own outstanding items", () => {
    const headline = readinessHeadline(readinessProgress(buildUnitReadiness(BARE)));
    expect(headline).toBe("2 things need you");
  });

  it("uses the singular for a single outstanding item", () => {
    const headline = readinessHeadline(
      readinessProgress(buildUnitReadiness({ ...READY, zone: null }))
    );
    expect(headline).toBe("1 thing needs you");
  });

  it("says so plainly when the wait is on Bright.Blue", () => {
    const headline = readinessHeadline(
      readinessProgress(
        buildUnitReadiness({ zone: "Hall A", mission: "welcome_gift", stockUnits: 100 })
      )
    );
    expect(headline).toBe("Nothing needs you — 1 item with Bright.Blue");
  });

  it("confirms a finished unit", () => {
    const headline = readinessHeadline(readinessProgress(buildUnitReadiness(READY)));
    expect(headline).toBe("Ready for the doors to open");
  });
});
