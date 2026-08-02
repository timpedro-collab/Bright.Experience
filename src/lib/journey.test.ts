/** Unit tests for the journey spine helpers. */
import { describe, it, expect } from "vitest";
import {
  phaseForStage,
  buildJourney,
  isStageAtOrAfter,
  nextCustomerMilestone,
} from "./journey";
import type { Milestone, Stage } from "@/types";

describe("isStageAtOrAfter", () => {
  it("is true when the stage equals the threshold", () => {
    expect(isStageAtOrAfter("logistics_confirmed", "logistics_confirmed")).toBe(true);
  });

  it("is true when the stage is beyond the threshold", () => {
    expect(isStageAtOrAfter("event_live", "logistics_confirmed")).toBe(true);
    expect(isStageAtOrAfter("complete", "build_configuration")).toBe(true);
  });

  it("is false when the stage is before the threshold", () => {
    expect(isStageAtOrAfter("creative_assets", "logistics_confirmed")).toBe(false);
    expect(isStageAtOrAfter("confirmed", "build_configuration")).toBe(false);
  });
});

describe("phaseForStage", () => {
  it("maps the opening stages to the Create phase", () => {
    expect(phaseForStage("confirmed")).toMatchObject({ id: "create", index: 0, total: 4 });
    expect(phaseForStage("approvals").id).toBe("create");
  });

  it("maps mid-delivery stages to Prepare", () => {
    expect(phaseForStage("build_configuration").id).toBe("prepare");
    expect(phaseForStage("logistics_confirmed").index).toBe(1);
  });

  it("maps the live stage to Event day and wrap stages to Results", () => {
    expect(phaseForStage("event_live")).toMatchObject({ id: "event-day", index: 2 });
    expect(phaseForStage("reporting").id).toBe("results");
    expect(phaseForStage("complete").index).toBe(3);
  });
});

function milestone(stage: Stage, status: Milestone["status"], sortOrder: number): Milestone {
  return {
    id: `${stage}-${sortOrder}`,
    eventId: "e1",
    name: `${stage} milestone`,
    stage,
    status,
    sortOrder,
    customerVisible: true,
  };
}

describe("buildJourney", () => {
  it("marks phases done / current / upcoming around the current stage", () => {
    const { phases, current } = buildJourney("build_configuration", []);
    expect(current.index).toBe(1);
    expect(phases.map((p) => p.state)).toEqual([
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("groups milestones under the phase their stage belongs to", () => {
    const milestones = [
      milestone("confirmed", "complete", 0),
      milestone("creative_assets", "in_progress", 1),
      milestone("event_live", "pending", 2),
    ];
    const { phases } = buildJourney("creative_assets", milestones);
    const create = phases.find((p) => p.id === "create");
    const eventDay = phases.find((p) => p.id === "event-day");
    expect(create?.milestones).toHaveLength(2);
    expect(eventDay?.milestones).toHaveLength(1);
  });

  it("derives milestone status from completion and stage position", () => {
    const milestones = [
      milestone("confirmed", "pending", 0), // earlier stage, not complete → done
      milestone("creative_assets", "pending", 1), // current stage → active
      milestone("reporting", "pending", 2), // later stage → upcoming
    ];
    const { phases } = buildJourney("creative_assets", milestones);
    const all = phases.flatMap((p) => p.milestones);
    expect(all.find((m) => m.id === "confirmed-0")?.status).toBe("done");
    expect(all.find((m) => m.id === "creative_assets-1")?.status).toBe("active");
    expect(all.find((m) => m.id === "reporting-2")?.status).toBe("upcoming");
  });

  it("labels approval and creative milestones as the customer's, others as Bright.Blue", () => {
    const milestones = [
      milestone("approvals", "pending", 0),
      milestone("qa_readiness", "pending", 1),
    ];
    const { phases } = buildJourney("approvals", milestones);
    const all = phases.flatMap((p) => p.milestones);
    expect(all.find((m) => m.id === "approvals-0")?.owner).toBe("you");
    expect(all.find((m) => m.id === "qa_readiness-1")?.owner).toBe("brightblue");
  });
});

describe("nextCustomerMilestone", () => {
  it("returns the next not-done milestone the customer owns", () => {
    const milestones = [
      milestone("creative_assets", "pending", 0), // owner you, upcoming
      milestone("approvals", "pending", 1), // owner you, upcoming
    ];
    const next = nextCustomerMilestone("confirmed", milestones);
    expect(next?.label).toBe("creative_assets milestone");
  });

  it("skips the customer's already-completed milestones", () => {
    const milestones = [
      milestone("creative_assets", "complete", 0), // done → skip
      milestone("approvals", "pending", 1), // owner you, upcoming
    ];
    const next = nextCustomerMilestone("confirmed", milestones);
    expect(next?.label).toBe("approvals milestone");
  });

  it("returns null when the customer owns nothing outstanding", () => {
    const milestones = [
      milestone("qa_readiness", "pending", 0), // Bright.Blue owns
      milestone("reporting", "pending", 1), // Bright.Blue owns
    ];
    expect(nextCustomerMilestone("qa_readiness", milestones)).toBeNull();
  });
});
