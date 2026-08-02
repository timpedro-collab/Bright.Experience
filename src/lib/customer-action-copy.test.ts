/** Unit tests for customer action "why it matters" copy. */
import { describe, it, expect } from "vitest";
import { actionWhyLine } from "./customer-action-copy";
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
});
