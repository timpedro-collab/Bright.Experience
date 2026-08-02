import { describe, it, expect } from "vitest";

import { buildSetupStory } from "./setup-story";

describe("buildSetupStory", () => {
  it("returns the preparation trail newest first", () => {
    const story = buildSetupStory({
      machine: {
        createdAt: "2026-07-01T09:00:00Z",
        updatedAt: "2026-07-14T09:00:00Z",
        zone: "Hall A",
        mission: "sponsor_activation",
      },
      config: { status: "tested", submittedAt: "2026-07-06T09:00:00Z" },
      slot: {
        sponsorName: "Salesforce",
        createdAt: "2026-07-02T09:00:00Z",
        updatedAt: "2026-07-10T09:00:00Z",
      },
      creative: [
        { name: "Sponsor wrap", reviewStatus: "approved", createdAt: "2026-07-12T09:00:00Z" },
      ],
    });

    expect(story.map((e) => e.id)).toEqual([
      "deployment",
      "creative-Sponsor wrap",
      "slot-sold",
      "config",
      "slot-opened",
      "registered",
    ]);
  });

  it("does not claim a placement for a unit that has no zone or job yet", () => {
    const story = buildSetupStory({
      machine: {
        createdAt: "2026-07-01T09:00:00Z",
        updatedAt: "2026-07-14T09:00:00Z",
        zone: null,
        mission: null,
      },
    });

    expect(story.map((e) => e.id)).toEqual(["registered"]);
    expect(story[0].detail).toBe("Waiting on a zone");
  });

  it("skips anything with no timestamp behind it", () => {
    const story = buildSetupStory({
      machine: { createdAt: null, updatedAt: null },
      config: { status: "draft" },
      slot: { sponsorName: "EE" },
    });

    expect(story).toEqual([]);
  });

  it("describes a submitted configuration differently from a tested one", () => {
    const submitted = buildSetupStory({
      config: { status: "submitted", updatedAt: "2026-07-06T09:00:00Z" },
    });
    expect(submitted[0].label).toBe("Game configuration submitted");

    const built = buildSetupStory({
      config: { status: "configured", updatedAt: "2026-07-06T09:00:00Z" },
    });
    expect(built[0].label).toBe("Game built");
  });

  it("only records a sale once the slot has actually changed hands", () => {
    const untouched = buildSetupStory({
      slot: {
        sponsorName: "Salesforce",
        createdAt: "2026-07-02T09:00:00Z",
        updatedAt: "2026-07-02T09:00:00Z",
      },
    });

    expect(untouched.map((e) => e.id)).toEqual(["slot-opened"]);
  });

  it("separates artwork that arrived from artwork that cleared review", () => {
    const story = buildSetupStory({
      creative: [
        { name: "Wrap", reviewStatus: "approved", createdAt: "2026-07-12T09:00:00Z" },
        { name: "Screen", reviewStatus: "pending_review", createdAt: "2026-07-13T09:00:00Z" },
      ],
    });

    expect(story.map((e) => e.label)).toEqual([
      "Artwork received",
      "Artwork approved",
    ]);
  });

  it("returns nothing at all for a unit with no history", () => {
    expect(buildSetupStory({})).toEqual([]);
  });
});
