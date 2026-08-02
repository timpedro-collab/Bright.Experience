import { describe, it, expect } from "vitest";

import {
  unitReadinessFor,
  showReadinessRows,
  showReadinessSummary,
  showReadinessLine,
  type ReadinessMachine,
  type ShowReadinessContext,
} from "./show-readiness";

const READY: ReadinessMachine = {
  id: "m1",
  label: "Registration unit",
  zone: "Hall A",
  mission: "welcome_gift",
};

const BARE: ReadinessMachine = {
  id: "m2",
  label: "Spare unit",
  zone: null,
  mission: null,
};

const CONTEXT: ShowReadinessContext = {
  gameConfigs: [
    {
      machineInstanceId: null,
      status: "tested",
      gameId: "g1",
      prizesJson: [{ quantity: 200 }, { quantity: "100" }],
    },
  ],
  productConfigs: [{ machineInstanceId: null, totalUnits: 800 }],
  slots: [],
};

describe("unitReadinessFor", () => {
  it("applies the show default when a unit has no configuration of its own", () => {
    const items = unitReadinessFor(READY, CONTEXT);
    const config = items.find((i) => i.id === "configuration");

    expect(config?.state).toBe("done");
    expect(config?.detail).toContain("300 prizes");
  });

  it("prefers a unit's own configuration over the show default", () => {
    const items = unitReadinessFor(READY, {
      ...CONTEXT,
      gameConfigs: [
        ...CONTEXT.gameConfigs,
        {
          machineInstanceId: "m1",
          status: "submitted",
          gameId: "g2",
          prizesJson: [],
        },
      ],
    });

    expect(items.find((i) => i.id === "configuration")?.state).toBe("waiting");
  });

  it("counts a unit's own stock plan ahead of the show-wide one", () => {
    const items = unitReadinessFor(READY, {
      ...CONTEXT,
      productConfigs: [
        { machineInstanceId: null, totalUnits: 800 },
        { machineInstanceId: "m1", totalUnits: 120 },
      ],
    });

    expect(items.find((i) => i.id === "stock")?.detail).toContain("120");
  });

  it("attaches the sponsor slot sitting on that unit and nobody else's", () => {
    const items = unitReadinessFor(READY, {
      ...CONTEXT,
      slots: [
        {
          machineInstanceId: "m2",
          sponsorName: "Salesforce",
          status: "reserved",
          creativeAssetIds: [],
        },
      ],
    });

    expect(items.find((i) => i.id === "sponsor")?.state).toBe("optional");
  });

  it("counts artwork as approved only when review says so", () => {
    const items = unitReadinessFor(READY, {
      ...CONTEXT,
      slots: [
        {
          machineInstanceId: "m1",
          sponsorName: "Salesforce",
          status: "reserved",
          creativeAssetIds: ["a1", "a2"],
        },
      ],
      creativeReview: { a1: "approved", a2: "pending_review" },
    });

    const creative = items.find((i) => i.id === "creative");
    expect(creative?.state).toBe("waiting");
    expect(creative?.detail).toContain("1 of 2");
  });

  it("ignores a slot that has not been attached to any unit", () => {
    const items = unitReadinessFor(READY, {
      ...CONTEXT,
      slots: [
        {
          machineInstanceId: null,
          sponsorName: "Salesforce",
          status: "reserved",
          creativeAssetIds: [],
        },
      ],
    });

    expect(items.find((i) => i.id === "sponsor")?.state).toBe("optional");
  });
});

describe("showReadinessRows", () => {
  it("puts the units needing the organizer at the top", () => {
    const rows = showReadinessRows([READY, BARE], CONTEXT);

    expect(rows[0].machine.id).toBe("m2");
    expect(rows[0].organizerTodo).toHaveLength(2);
    expect(rows[1].isReady).toBe(true);
  });

  it("returns an empty board for a show with no units", () => {
    expect(showReadinessRows([], CONTEXT)).toEqual([]);
  });
});

describe("showReadinessSummary", () => {
  it("counts ready units and outstanding organizer work", () => {
    const summary = showReadinessSummary(showReadinessRows([READY, BARE], CONTEXT));

    expect(summary).toEqual({
      units: 2,
      ready: 1,
      organizerTodo: 2,
      waitingOnUs: 0,
    });
  });

  it("counts units waiting on us separately from the organizer's own", () => {
    const summary = showReadinessSummary(
      showReadinessRows([READY], { ...CONTEXT, gameConfigs: [] })
    );

    expect(summary.waitingOnUs).toBe(1);
    expect(summary.organizerTodo).toBe(0);
  });
});

describe("showReadinessLine", () => {
  it("leads with what is ready and follows with what is left", () => {
    const line = showReadinessLine({
      units: 3,
      ready: 1,
      organizerTodo: 2,
      waitingOnUs: 1,
    });

    expect(line).toBe("1 of 3 units ready · 2 things need you");
  });

  it("drops the tail when nothing needs the organizer", () => {
    expect(
      showReadinessLine({ units: 1, ready: 1, organizerTodo: 0, waitingOnUs: 0 })
    ).toBe("1 of 1 unit ready");
  });

  it("says so plainly when a show has no units", () => {
    expect(
      showReadinessLine({ units: 0, ready: 0, organizerTodo: 0, waitingOnUs: 0 })
    ).toBe("No units on this show yet");
  });
});
