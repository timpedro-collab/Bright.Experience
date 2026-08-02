/** Tests for the brief echo ("what you told us") copy helpers. */

import { describe, it, expect } from "vitest";
import { briefEchoItems } from "./brief-echo";

describe("briefEchoItems", () => {
  it("returns an empty list when the customer gave no answers", () => {
    expect(briefEchoItems({})).toEqual([]);
  });

  it("plays back a full tradeshow brief in order", () => {
    const items = briefEchoItems({
      eventType: "activation",
      objective: "Lead generation and pipeline",
      venueName: "ExCeL London",
      postcode: "E16",
      eventDateStart: "2026-09-05",
      eventDateEnd: "2026-09-07",
      attendees: "2500",
    });
    expect(items).toEqual([
      { label: "The moment", value: "A brand activation" },
      { label: "Your goal", value: "Lead generation and pipeline" },
      { label: "Where", value: "ExCeL London (E16)" },
      { label: "When", value: "5 Sep–7 Sep 2026" },
      { label: "The crowd", value: "~2,500 attendees" },
    ]);
  });

  it("falls back to the quiz timeline when no dates were given", () => {
    const items = briefEchoItems({ eventTimeline: "1-3-months" });
    expect(items).toEqual([{ label: "When", value: "In 1–3 months" }]);
  });

  it("uses the activation location and day count for experiential briefs", () => {
    const items = briefEchoItems({
      activationLocation: "London Waterloo",
      activationDays: "3",
    });
    expect(items).toEqual([
      { label: "Where", value: "London Waterloo" },
      { label: "On site", value: "3 days" },
    ]);
  });

  it("formats a footfall range as expected visitors", () => {
    const items = briefEchoItems({ footfallEstimate: "5000-10000" });
    expect(items).toEqual([
      { label: "The crowd", value: "5,000–10,000 expected visitors" },
    ]);
  });

  it("passes free-text footfall through untouched", () => {
    const items = briefEchoItems({ footfallEstimate: "A few thousand a day" });
    expect(items).toEqual([
      { label: "The crowd", value: "A few thousand a day" },
    ]);
  });

  it("shows a single date without a range", () => {
    const items = briefEchoItems({ eventDateStart: "2026-08-22" });
    expect(items).toEqual([{ label: "When", value: "22 Aug 2026" }]);
  });

  it("skips unknown event types rather than echoing raw slugs", () => {
    expect(briefEchoItems({ eventType: "mystery-format" })).toEqual([]);
  });
});
