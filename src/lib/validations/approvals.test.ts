/**
 * Tests for the approval decision schema. Tiny, but the approval
 * action is one of the most-clicked customer-facing buttons in the
 * portal — input validation here is the difference between a clean
 * error message and a 500.
 */

import { describe, it, expect } from "vitest";
import { approvalDecisionSchema } from "./approvals";

describe("approvalDecisionSchema", () => {
  const valid = {
    approvalId: "00000000-0000-4000-8000-000000000001",
    decision: "approved" as const,
    feedback: "Looks great",
  };

  it("accepts a valid approve decision", () => {
    expect(() => approvalDecisionSchema.parse(valid)).not.toThrow();
  });

  it("accepts a revision_requested decision", () => {
    expect(() =>
      approvalDecisionSchema.parse({ ...valid, decision: "revision_requested" })
    ).not.toThrow();
  });

  it("accepts a rejected decision", () => {
    expect(() =>
      approvalDecisionSchema.parse({ ...valid, decision: "rejected" })
    ).not.toThrow();
  });

  it("makes feedback optional", () => {
    const { feedback: _, ...withoutFeedback } = valid;
    void _;
    expect(() => approvalDecisionSchema.parse(withoutFeedback)).not.toThrow();
  });

  it("rejects an invalid UUID", () => {
    expect(() =>
      approvalDecisionSchema.parse({ ...valid, approvalId: "not-a-uuid" })
    ).toThrow(/Invalid approval ID/);
  });

  it("rejects an unknown decision value", () => {
    expect(() =>
      approvalDecisionSchema.parse({ ...valid, decision: "yolo" })
    ).toThrow();
  });
});
