import { describe, it, expect } from "vitest";
import { MISSION_LABELS, MISSION_DESCRIPTIONS, missionLabel } from "./fleet-labels";

describe("mission labels", () => {
  it("labels and describes every mission the schema allows", () => {
    const missions = [
      "lead_capture",
      "sponsor_activation",
      "welcome_gift",
      "rebook_reward",
      "sampling",
    ] as const;
    for (const mission of missions) {
      expect(MISSION_LABELS[mission]).toBeTruthy();
      expect(MISSION_DESCRIPTIONS[mission]).toBeTruthy();
    }
  });
});

describe("missionLabel", () => {
  it("returns the label for an assigned mission", () => {
    expect(missionLabel("sponsor_activation")).toBe("Sponsor activation");
  });

  it("falls back for machines with no mission set", () => {
    expect(missionLabel(null)).toBe("Unassigned");
    expect(missionLabel(undefined)).toBe("Unassigned");
  });
});
