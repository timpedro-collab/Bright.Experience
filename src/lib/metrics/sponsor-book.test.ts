import { describe, it, expect } from "vitest";

import {
  buildSponsorBook,
  sponsorBookTotals,
  slotUrgency,
  doorsLabel,
  type SponsorBookSlot,
} from "./sponsor-book";

const TODAY = "2026-07-27";

function slot(overrides: Partial<SponsorBookSlot> & { id: string }): SponsorBookSlot {
  return {
    eventId: "e1",
    showName: "Tech Live North",
    status: "available",
    startDate: "2026-11-10",
    price: 250000,
    ...overrides,
  };
}

describe("slotUrgency", () => {
  it("treats anything not available as sold", () => {
    expect(slotUrgency("reserved", 100)).toBe("sold");
    expect(slotUrgency("confirmed", -5)).toBe("sold");
  });

  it("flags an unsold slot inside the selling window as closing", () => {
    expect(slotUrgency("available", 21)).toBe("closing");
    expect(slotUrgency("available", 22)).toBe("open");
  });

  it("calls an unsold slot past the doors what it is", () => {
    expect(slotUrgency("available", -1)).toBe("missed");
  });
});

describe("buildSponsorBook", () => {
  it("groups slots by the show they belong to", () => {
    const book = buildSponsorBook(
      [
        slot({ id: "1" }),
        slot({ id: "2" }),
        slot({ id: "3", eventId: "e2", showName: "Retail Expo" }),
      ],
      TODAY
    );

    expect(book).toHaveLength(2);
    expect(book[0].slots).toHaveLength(2);
  });

  it("puts the show with the nearest doors first", () => {
    const book = buildSponsorBook(
      [
        slot({ id: "1", startDate: "2026-11-10" }),
        slot({ id: "2", eventId: "e2", showName: "Soon", startDate: "2026-08-01" }),
      ],
      TODAY
    );

    expect(book[0].showName).toBe("Soon");
  });

  it("drops shows that have already run to the bottom, newest first", () => {
    const book = buildSponsorBook(
      [
        slot({ id: "1", eventId: "e1", showName: "Old", startDate: "2026-01-10" }),
        slot({ id: "2", eventId: "e2", showName: "Recent", startDate: "2026-07-01" }),
        slot({ id: "3", eventId: "e3", showName: "Upcoming", startDate: "2026-09-01" }),
      ],
      TODAY
    );

    expect(book.map((s) => s.showName)).toEqual(["Upcoming", "Recent", "Old"]);
  });

  it("splits value between what is sold and what is still going", () => {
    const book = buildSponsorBook(
      [
        slot({ id: "1", status: "reserved", price: 300000 }),
        slot({ id: "2", price: 250000 }),
      ],
      TODAY
    );

    expect(book[0]).toMatchObject({
      soldCount: 1,
      openCount: 1,
      soldValue: 300000,
      openValue: 250000,
    });
  });

  it("counts unsold slots on a show inside the window as at risk", () => {
    const book = buildSponsorBook(
      [slot({ id: "1", startDate: "2026-08-05" }), slot({ id: "2", status: "reserved" })],
      TODAY
    );

    expect(book[0].atRiskCount).toBe(1);
  });

  it("takes the earliest slot as the show's doors", () => {
    const book = buildSponsorBook(
      [
        slot({ id: "1", startDate: "2026-11-12" }),
        slot({ id: "2", startDate: "2026-11-10" }),
      ],
      TODAY
    );

    expect(book[0].startDate).toBe("2026-11-10");
    expect(book[0].daysToDoors).toBe(106);
  });

  it("keeps slots with no event id grouped by name rather than losing them", () => {
    const book = buildSponsorBook([slot({ id: "1", eventId: null })], TODAY);

    expect(book[0].slots).toHaveLength(1);
    expect(book[0].eventId).toBeNull();
  });

  it("returns an empty book when nothing is on sale", () => {
    expect(buildSponsorBook([], TODAY)).toEqual([]);
  });
});

describe("sponsorBookTotals", () => {
  it("adds up the whole book", () => {
    const book = buildSponsorBook(
      [
        slot({ id: "1", status: "reserved", price: 300000 }),
        slot({ id: "2", startDate: "2026-08-05", price: 250000 }),
        slot({ id: "3", eventId: "e2", showName: "Other", price: 100000 }),
      ],
      TODAY
    );

    expect(sponsorBookTotals(book)).toEqual({
      slots: 3,
      sold: 1,
      open: 2,
      atRisk: 1,
      soldValue: 300000,
      openValue: 350000,
    });
  });
});

describe("doorsLabel", () => {
  it("counts down to the doors", () => {
    expect(doorsLabel(12)).toBe("12 days to doors");
    expect(doorsLabel(1)).toBe("Doors tomorrow");
    expect(doorsLabel(0)).toBe("Doors today");
  });

  it("says a show has run rather than counting negatives", () => {
    expect(doorsLabel(-4)).toBe("Already run");
  });
});
