/**
 * Tests for the task reassignment schema.
 */

import { describe, it, expect } from "vitest";
import { reassignTaskSchema, REASSIGNABLE_CATEGORIES } from "./tasks";

const TASK_ID = "d6666666-6666-6666-6666-666666666666";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";

describe("reassignTaskSchema", () => {
  it("accepts a team-lane reassignment", () => {
    expect(() =>
      reassignTaskSchema.parse({ taskId: TASK_ID, category: "operations" })
    ).not.toThrow();
  });

  it("accepts an assignee change (and clearing it with null)", () => {
    expect(() =>
      reassignTaskSchema.parse({ taskId: TASK_ID, assignedToId: PROFILE_ID })
    ).not.toThrow();
    expect(() =>
      reassignTaskSchema.parse({ taskId: TASK_ID, assignedToId: null })
    ).not.toThrow();
  });

  it("accepts every reassignable team lane", () => {
    for (const category of REASSIGNABLE_CATEGORIES) {
      expect(() =>
        reassignTaskSchema.parse({ taskId: TASK_ID, category })
      ).not.toThrow();
    }
  });

  it("rejects the customer-owned admin lane", () => {
    expect(() =>
      reassignTaskSchema.parse({ taskId: TASK_ID, category: "admin" })
    ).toThrow();
  });

  it("rejects when nothing is being changed", () => {
    expect(() => reassignTaskSchema.parse({ taskId: TASK_ID })).toThrow(
      /Nothing to reassign/
    );
  });

  it("rejects a malformed task id", () => {
    expect(() =>
      reassignTaskSchema.parse({ taskId: "t-1", category: "creative" })
    ).toThrow(/Invalid task ID/);
  });
});
