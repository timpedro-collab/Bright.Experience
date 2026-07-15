/**
 * Tests for the home focus-list assembler — the cross-event queues each
 * internal role sees ("what needs you now").
 */

import { describe, it, expect } from "vitest";
import { buildFocusItems, type FocusItem } from "./home-focus";
import type { PortfolioStats } from "@/lib/queries/portfolio";
import type { Event, UserRole } from "@/types";

function makeEvent(overrides: Partial<Event>): Event {
  return {
    id: "e1",
    accountId: "acc1",
    account: { id: "acc1", name: "Acme" },
    name: "Spring Launch",
    eventType: "retail",
    packageType: "standard",
    currentStage: "confirmed",
    healthStatus: "green",
    eventDateStart: "2099-06-01",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Event;
}

function makePortfolio(events: Event[]): PortfolioStats {
  return {
    total: events.length,
    onTrack: 0,
    atRisk: 0,
    blocked: 0,
    live: 0,
    stageData: [],
    events,
  };
}

function build(role: UserRole, events: Event[]): FocusItem[] {
  return buildFocusItems({
    role,
    portfolio: makePortfolio(events),
    queueCounts: null,
    taskGroups: [],
  });
}

describe("QA sign-off queue", () => {
  const qaGateEvent = makeEvent({
    id: "e-qa",
    name: "Galaxy Launch",
    currentStage: "qa_readiness",
  });

  it("surfaces events at the QA-readiness gate for the QA lead", () => {
    const items = build("qa_lead", [qaGateEvent]);
    const qa = items.find((i) => i.kind === "qa_signoff");
    expect(qa).toBeDefined();
    expect(qa!.title).toMatch(/QA sign-off: Galaxy Launch/);
    expect(qa!.href).toBe("/events/e-qa/qa");
  });

  it("surfaces the QA gate for orchestrators too", () => {
    const items = build("events_lead", [qaGateEvent]);
    expect(items.some((i) => i.kind === "qa_signoff")).toBe(true);
  });

  it("does not show events at other stages as QA work", () => {
    const items = build("qa_lead", [
      makeEvent({ id: "e2", currentStage: "creative_assets" }),
    ]);
    expect(items.some((i) => i.kind === "qa_signoff")).toBe(false);
  });

  it("does not show the QA queue to the creative lead", () => {
    const items = build("creative_lead", [qaGateEvent]);
    expect(items.some((i) => i.kind === "qa_signoff")).toBe(false);
  });
});

describe("ops setup queue", () => {
  it("surfaces upcoming setups for the ops lead", () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const items = build("operations_lead", [
      makeEvent({ id: "e-setup", setupDate: soon, venueName: "Westfield" }),
    ]);
    const setup = items.find((i) => i.kind === "setup");
    expect(setup).toBeDefined();
    expect(setup!.tone).toBe("warning");
    expect(setup!.href).toBe("/events/e-setup/logistics");
  });

  it("escalates an overdue setup to critical instead of dropping it", () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const items = build("operations_lead", [
      makeEvent({ id: "e-late", setupDate: past }),
    ]);
    const setup = items.find((i) => i.kind === "setup");
    expect(setup).toBeDefined();
    expect(setup!.tone).toBe("critical");
    expect(setup!.title).toMatch(/overdue/i);
  });

  it("skips completed events entirely", () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const items = build("operations_lead", [
      makeEvent({ id: "e-done", setupDate: past, currentStage: "complete" }),
    ]);
    expect(items.some((i) => i.kind === "setup")).toBe(false);
  });
});
