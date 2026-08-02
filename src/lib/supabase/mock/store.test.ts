/** Unit tests for the mock store's id backfill. */
import { describe, it, expect } from "vitest";
import { backfillMissingIds, type MockRow } from "./store";

describe("backfillMissingIds", () => {
  it("assigns stable table-index ids to rows without one", () => {
    const db: Record<string, MockRow[]> = {
      milestones: [{ name: "Kickoff" }, { name: "QA" }],
    };
    backfillMissingIds(db);
    expect(db.milestones.map((r) => r.id)).toEqual([
      "milestones-0",
      "milestones-1",
    ]);
  });

  it("leaves rows that already have an id untouched", () => {
    const db: Record<string, MockRow[]> = {
      tasks: [{ id: "t-1", title: "Upload" }, { title: "Approve" }],
    };
    backfillMissingIds(db);
    expect(db.tasks[0].id).toBe("t-1");
    expect(db.tasks[1].id).toBe("tasks-1");
  });
});
