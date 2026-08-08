import { describe, expect, it } from "vitest";

import {
  computeMonthAvailability,
  monthLabel,
  upcomingMonths,
  type FleetRows,
} from "./fleet-availability";

const rows: FleetRows = {
  instances: [
    { id: "u1", current_event_id: "ev-march" },
    { id: "u2", current_event_id: "ev-march" },
    { id: "u3", current_event_id: null },
    { id: "u4", current_event_id: null },
    { id: "u5", current_event_id: "ev-cancelled" },
  ],
  events: [
    {
      id: "ev-march",
      event_date_start: "2027-03-10",
      event_date_end: "2027-03-12",
      stage: "production",
    },
    {
      id: "ev-cancelled",
      event_date_start: "2027-03-20",
      event_date_end: "2027-03-21",
      stage: "cancelled",
    },
    {
      id: "ev-april-unallocated",
      event_date_start: "2027-04-05",
      event_date_end: null,
      stage: "approvals",
    },
  ],
  placements: [
    {
      machine_instance_id: "u4",
      start_date: "2027-02-01",
      end_date: "2027-03-31",
      status: "active",
    },
  ],
};

describe("computeMonthAvailability", () => {
  it("counts units on overlapping events and placements, ignoring cancelled events", () => {
    const result = computeMonthAvailability(rows, "2027-03");
    // u1 + u2 (event) + u4 (placement); the cancelled event's unit is free.
    expect(result).toMatchObject({ total: 5, booked: 3 });
    expect(result.label).toBe("March 2027");
  });

  it("reserves a unit for booked events with no machine allocated yet", () => {
    const result = computeMonthAvailability(rows, "2027-04");
    expect(result.booked).toBe(1);
  });

  it("reports zero booked for an empty month", () => {
    expect(computeMonthAvailability(rows, "2027-07").booked).toBe(0);
  });

  it("never reports more booked units than the fleet holds", () => {
    const tiny: FleetRows = {
      instances: [{ id: "u1", current_event_id: null }],
      events: [
        { id: "a", event_date_start: "2027-03-01", event_date_end: null, stage: "production" },
        { id: "b", event_date_start: "2027-03-02", event_date_end: null, stage: "production" },
      ],
      placements: [],
    };
    expect(computeMonthAvailability(tiny, "2027-03").booked).toBe(1);
  });

  it("treats a single-day event as occupying its start date's month only", () => {
    expect(computeMonthAvailability(rows, "2027-02").booked).toBe(1); // placement only
  });
});

describe("upcomingMonths", () => {
  it("returns the next n months starting after the given date, crossing year ends", () => {
    expect(upcomingMonths(3, new Date(Date.UTC(2026, 10, 15)))).toEqual([
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });
});

describe("monthLabel", () => {
  it("spells the month in full with its year", () => {
    expect(monthLabel("2026-09")).toBe("September 2026");
  });
});
