/**
 * Unit tests for the deadline grouping helpers.
 *
 * The grouping logic is the heart of the "one number for workload" rule:
 * individual asset uploads fold beneath the "Upload brand assets" umbrella
 * task so a customer sees one obligation, not a dozen.
 */
import { describe, it, expect, vi } from "vitest";

// deadlines.ts imports the server Supabase client at module load; the grouping
// helpers under test never call it, but we stub the import so it loads cleanly.
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import {
  groupDeadlineAssets,
  groupCustomerActionAssets,
  type DeadlineItem,
  type CustomerActionItem,
} from "./deadlines";

function deadline(overrides: Partial<DeadlineItem>): DeadlineItem {
  return {
    id: "x",
    eventId: "e1",
    entityType: "task",
    title: "Task",
    dueDate: "2026-08-01",
    urgency: "on_track",
    owner: "customer",
    status: "pending",
    ...overrides,
  };
}

describe("groupDeadlineAssets", () => {
  it("folds asset deadlines beneath the assets umbrella task", () => {
    const items = [
      deadline({ id: "umbrella", entityType: "task", targetPath: "assets", title: "Upload brand assets" }),
      deadline({ id: "a1", entityType: "asset", title: "Logo" }),
      deadline({ id: "a2", entityType: "asset", title: "Hero image" }),
      deadline({ id: "brief", entityType: "task", targetPath: "briefing", title: "Briefing" }),
    ];
    const grouped = groupDeadlineAssets(items);

    expect(grouped).toHaveLength(2);
    const umbrella = grouped.find((g) => g.id === "umbrella");
    expect(umbrella?.children).toHaveLength(2);
    expect(grouped.some((g) => g.entityType === "asset")).toBe(false);
  });

  it("escalates the umbrella urgency to its most urgent child", () => {
    const items = [
      deadline({ id: "umbrella", entityType: "task", targetPath: "assets", urgency: "on_track" }),
      deadline({ id: "a1", entityType: "asset", urgency: "overdue" }),
    ];
    const grouped = groupDeadlineAssets(items);
    expect(grouped.find((g) => g.id === "umbrella")?.urgency).toBe("overdue");
  });

  it("leaves items untouched when there is no umbrella task", () => {
    const items = [
      deadline({ id: "a1", entityType: "asset", title: "Logo" }),
      deadline({ id: "m1", entityType: "milestone", title: "Kickoff" }),
    ];
    const grouped = groupDeadlineAssets(items);
    expect(grouped).toHaveLength(2);
    expect(grouped.find((g) => g.id === "a1")?.children).toBeUndefined();
  });
});

function action(overrides: Partial<CustomerActionItem>): CustomerActionItem {
  return {
    id: "x",
    eventId: "e1",
    entityType: "task",
    title: "Task",
    ...overrides,
  };
}

describe("groupCustomerActionAssets", () => {
  it("collapses asset uploads into a single umbrella obligation", () => {
    const items = [
      action({ id: "umbrella", entityType: "task", targetPath: "assets", title: "Upload brand assets" }),
      action({ id: "a1", entityType: "asset", title: "Upload: Logo" }),
      action({ id: "a2", entityType: "asset", title: "Upload: Hero" }),
      action({ id: "a3", entityType: "asset", title: "Upload: Wrap" }),
    ];
    const grouped = groupCustomerActionAssets(items);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].children).toHaveLength(3);
  });

  it("keeps assets standalone when no umbrella task exists", () => {
    const items = [
      action({ id: "a1", entityType: "asset", title: "Upload: Logo" }),
      action({ id: "brief", entityType: "briefing", title: "Complete briefing" }),
    ];
    const grouped = groupCustomerActionAssets(items);
    expect(grouped).toHaveLength(2);
  });

  it("inherits the most urgent child urgency onto the umbrella", () => {
    const items = [
      action({ id: "umbrella", entityType: "task", targetPath: "assets", urgency: "due_soon" }),
      action({ id: "a1", entityType: "asset", urgency: "overdue" }),
    ];
    const grouped = groupCustomerActionAssets(items);
    expect(grouped[0].urgency).toBe("overdue");
  });
});
