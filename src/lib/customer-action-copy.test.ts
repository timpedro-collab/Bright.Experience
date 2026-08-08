/** Unit tests for customer action "why it matters" copy and asset grouping. */
import { describe, it, expect } from "vitest";
import {
  actionWhyLine,
  groupAssetActions,
  GROUPED_ASSETS_ID,
} from "./customer-action-copy";
import type { CustomerActionItem } from "@/lib/queries/deadlines";

function item(partial: Partial<CustomerActionItem>): CustomerActionItem {
  return {
    id: "x",
    eventId: "e1",
    entityType: "task",
    title: "Do the thing",
    ...partial,
  };
}

describe("actionWhyLine", () => {
  it("explains asset uploads in terms of the studio build", () => {
    expect(actionWhyLine(item({ entityType: "asset", title: "Upload: Logo" }))).toBe(
      "So the studio can build your creative.",
    );
  });

  it("distinguishes ops and creative briefings", () => {
    expect(
      actionWhyLine(item({ entityType: "briefing", id: "briefing-ops" })),
    ).toBe("So we can plan delivery and setup for the day.");
    expect(
      actionWhyLine(item({ entityType: "briefing", id: "briefing-creative" })),
    ).toBe("So the studio can start designing your activation.");
  });

  it("infers a task's reason from the section it targets", () => {
    expect(actionWhyLine(item({ targetPath: "approvals" }))).toBe(
      "So we can lock the build and stay on schedule.",
    );
    expect(actionWhyLine(item({ targetPath: "logistics" }))).toBe(
      "So we can schedule delivery to your venue.",
    );
  });

  it("falls back to a generic on-track reason", () => {
    expect(actionWhyLine(item({ targetPath: undefined }))).toBe(
      "Keeps your activation on track.",
    );
  });

  it("explains the grouped asset row as a single upload flow", () => {
    expect(
      actionWhyLine(item({ id: GROUPED_ASSETS_ID, entityType: "asset" })),
    ).toBe("Everything uploads in one flow — drag them all in at once.");
  });
});

describe("groupAssetActions", () => {
  it("collapses 2+ asset items into one row in the first asset's position", () => {
    const grouped = groupAssetActions([
      item({ id: "t1", entityType: "task", title: "Approve proof" }),
      item({ id: "a1", entityType: "asset", title: "Upload: Logo" }),
      item({ id: "b1", entityType: "briefing", title: "Complete: Ops briefing" }),
      item({ id: "a2", entityType: "asset", title: "Upload: Guidelines" }),
      item({ id: "a3", entityType: "asset", title: "Upload: Hero artwork" }),
    ]);
    expect(grouped.map((i) => i.id)).toEqual(["t1", GROUPED_ASSETS_ID, "b1"]);
    expect(grouped[1].title).toBe("3 brand assets · one upload flow");
    expect(grouped[1].entityType).toBe("asset");
  });

  it("inherits the earliest due date and worst urgency of its members", () => {
    const grouped = groupAssetActions([
      item({ id: "a1", entityType: "asset", dueDate: "2026-08-20", urgency: "due_soon" }),
      item({ id: "a2", entityType: "asset", dueDate: "2026-08-05", urgency: "overdue" }),
      item({ id: "a3", entityType: "asset", urgency: "on_track" }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].dueDate).toBe("2026-08-05");
    expect(grouped[0].urgency).toBe("overdue");
  });

  it("leaves due date and urgency unset when no member has them", () => {
    const grouped = groupAssetActions([
      item({ id: "a1", entityType: "asset" }),
      item({ id: "a2", entityType: "asset" }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].dueDate).toBeUndefined();
    expect(grouped[0].urgency).toBeUndefined();
  });

  it("returns lists with 0 or 1 asset items unchanged", () => {
    const noAssets = [item({ id: "t1", entityType: "task" })];
    expect(groupAssetActions(noAssets)).toEqual(noAssets);

    const oneAsset = [
      item({ id: "a1", entityType: "asset", title: "Upload: Logo" }),
      item({ id: "t1", entityType: "task" }),
    ];
    expect(groupAssetActions(oneAsset)).toEqual(oneAsset);
  });
});
