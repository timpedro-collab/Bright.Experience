import { describe, expect, it } from "vitest";

import {
  nextStepForStage,
  resolveEventNextStep,
} from "./event-next-step";
import type { Event, Task, Asset, Approval } from "@/types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "evt-1",
    accountId: "acc-1",
    account: { id: "acc-1", name: "Test Co", slug: "test-co" },
    name: "Test Event",
    eventType: "activation",
    packageType: "standard",
    eventDateStart: "2026-09-01",
    currentStage: "creative_assets",
    healthStatus: "green",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

describe("nextStepForStage", () => {
  it("returns a customer CTA for customer roles", () => {
    const step = nextStepForStage("creative_assets", "evt-1", "customer_admin");
    expect(step.primaryAction.href).toBe("/events/evt-1/assets");
    expect(step.primaryAction.label).toMatch(/upload/i);
  });

  it("returns an internal CTA for internal roles", () => {
    const step = nextStepForStage("creative_assets", "evt-1", "events_lead");
    expect(step.primaryAction.href).toBe("/events/evt-1/assets");
    expect(step.eyebrow).toMatch(/gathering/i);
  });

  it("supports absolute hrefs (e.g. /book/configure on complete)", () => {
    const step = nextStepForStage("complete", "evt-1", "customer_admin");
    expect(step.secondaryAction?.href).toBe("/book/configure");
  });

  it("covers every stage", () => {
    const stages = [
      "confirmed",
      "kickoff_complete",
      "creative_assets",
      "approvals",
      "build_configuration",
      "qa_readiness",
      "logistics_confirmed",
      "event_live",
      "reporting",
      "complete",
    ] as const;
    for (const stage of stages) {
      const step = nextStepForStage(stage, "evt-1", "customer_admin");
      expect(step.primaryAction.href).toBeTruthy();
      expect(step.title.length).toBeGreaterThan(0);
    }
  });
});

describe("resolveEventNextStep", () => {
  const base: Parameters<typeof resolveEventNextStep>[0] = {
    event: makeEvent(),
    tasks: [],
    assets: [],
    approvals: [],
    isInternal: false,
  };

  it("returns the action callout when health is red", () => {
    const step = resolveEventNextStep({
      ...base,
      event: makeEvent({ healthStatus: "red" }),
    });
    expect(step?.tone).toBe("warning");
    expect(step?.primaryAction.href).toBe("/events/evt-1/actions");
  });

  it("returns the live dashboard CTA at event_live regardless of asset state", () => {
    const step = resolveEventNextStep({
      ...base,
      event: makeEvent({ currentStage: "event_live" }),
      assets: [makeAsset({ status: "required" })],
    });
    expect(step?.tone).toBe("success");
    expect(step?.primaryAction.href).toBe("/events/evt-1/live");
  });

  it("prioritises pending approvals over the per-stage default", () => {
    const step = resolveEventNextStep({
      ...base,
      event: makeEvent({ currentStage: "build_configuration" }),
      approvals: [makeApproval({ status: "pending", title: "Hero artwork v1" })],
    });
    expect(step?.eyebrow).toMatch(/approval/i);
    expect(step?.description).toContain("Hero artwork v1");
  });

  it("prioritises missing assets over the per-stage default", () => {
    const step = resolveEventNextStep({
      ...base,
      event: makeEvent({ currentStage: "build_configuration" }),
      assets: [makeAsset({ status: "required" })],
    });
    expect(step?.eyebrow).toMatch(/assets due/i);
    expect(step?.primaryAction.href).toBe("/events/evt-1/assets");
  });

  it("falls through to the per-stage default for the customer view", () => {
    const step = resolveEventNextStep({
      ...base,
      event: makeEvent({ currentStage: "qa_readiness" }),
    });
    expect(step?.primaryAction.href).toBe("/events/evt-1/qa");
    expect(step?.eyebrow).toMatch(/quality assurance/i);
  });

  it("falls through to the per-stage default for the internal view", () => {
    const step = resolveEventNextStep({
      ...base,
      event: makeEvent({ currentStage: "qa_readiness" }),
      isInternal: true,
    });
    expect(step?.primaryAction.href).toBe("/events/evt-1/qa");
    expect(step?.eyebrow).toMatch(/QA in progress/i);
  });
});

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "a1",
    eventId: "evt-1",
    name: "Hero artwork",
    assetType: "image",
    version: 1,
    status: "required",
    customerVisible: true,
    reviewStatus: "pending_review",
    revisionCount: 0,
    ...overrides,
  };
}

function makeApproval(overrides: Partial<Approval> = {}): Approval {
  return {
    id: "ap1",
    eventId: "evt-1",
    title: "Hero artwork",
    approvalType: "creative",
    status: "pending",
    requestedAt: "2026-01-01",
    revisionCount: 0,
    customerVisible: true,
    ...overrides,
  };
}

const _unusedTask: Task = {
  id: "t1",
  eventId: "evt-1",
  title: "Sample",
  taskType: "customer_action",
  category: "creative",
  status: "pending",
  priority: "medium",
  isBlocking: false,
  customerVisible: true,
  sortOrder: 0,
};
void _unusedTask;
