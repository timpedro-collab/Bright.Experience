import { describe, expect, it } from "vitest";
import { shiftDateString, shiftDates, shiftDaysFrom } from "./shift-dates";

describe("shiftDaysFrom", () => {
  it("returns zero when today equals the authored anchor", () => {
    expect(shiftDaysFrom("2026-06-18", new Date("2026-06-18T09:00:00Z"))).toBe(0);
  });

  it("returns a positive offset when today is after the anchor", () => {
    expect(shiftDaysFrom("2026-06-18", new Date("2026-07-18T00:00:00Z"))).toBe(30);
  });

  it("returns a negative offset when today is before the anchor", () => {
    expect(shiftDaysFrom("2026-06-18", new Date("2026-06-08T00:00:00Z"))).toBe(-10);
  });
});

describe("shiftDateString", () => {
  it("shifts a date-only string and preserves the date-only format", () => {
    expect(shiftDateString("2026-06-18", 10)).toBe("2026-06-28");
  });

  it("shifts an ISO datetime and preserves the time component", () => {
    expect(shiftDateString("2026-06-18T09:00:00Z", 5)).toBe("2026-06-23T09:00:00Z");
  });

  it("leaves non-date strings untouched", () => {
    expect(shiftDateString("e1111111-1111-1111-1111-111111111111", 30)).toBe(
      "e1111111-1111-1111-1111-111111111111",
    );
    expect(shiftDateString("London W2 2UH", 30)).toBe("London W2 2UH");
    expect(shiftDateString("CC-ORIG-330", 30)).toBe("CC-ORIG-330");
  });
});

describe("shiftDates", () => {
  it("recursively shifts date fields inside nested objects and arrays", () => {
    const input = {
      id: "abc",
      event_date_start: "2026-06-18",
      created_at: "2026-06-18T09:00:00Z",
      count: 3,
      nested: [{ target_date: "2026-06-20" }, { name: "not a date" }],
    };
    const out = shiftDates(input, 7);
    expect(out).toEqual({
      id: "abc",
      event_date_start: "2026-06-25",
      created_at: "2026-06-25T09:00:00Z",
      count: 3,
      nested: [{ target_date: "2026-06-27" }, { name: "not a date" }],
    });
  });

  it("returns the value untouched when the offset is zero", () => {
    const input = { target_date: "2026-06-18" };
    expect(shiftDates(input, 0)).toBe(input);
  });

  it("does not mutate the input structure", () => {
    const input = { target_date: "2026-06-18" };
    shiftDates(input, 5);
    expect(input.target_date).toBe("2026-06-18");
  });
});
