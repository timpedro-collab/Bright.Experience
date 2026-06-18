/**
 * Tests for the ownership grouping helpers used by the timeline and
 * `EventOwnershipPanel`. Driven entirely from `Task` fixtures so we
 * can exercise the category→owner mapping and the "Waiting on you"
 * personalisation in one place.
 */

import { describe, it, expect } from "vitest";
import { ownerLabelFor, ownerForMilestone, groupOpenTasksByOwner } from "./ownership";
import { makeTask } from "@/test/fixtures";

describe("ownerLabelFor", () => {
  it("says 'Waiting on you' when customer is viewing customer-owned work", () => {
    expect(ownerLabelFor("customer", "customer_admin")).toBe("Waiting on you");
    expect(ownerLabelFor("customer", "customer_user")).toBe("Waiting on you");
  });

  it("says 'Waiting on Bright.Blue creative' to a customer viewing creative work", () => {
    expect(ownerLabelFor("creative", "customer_admin")).toBe(
      "Waiting on Bright.Blue creative"
    );
  });

  it("says 'Waiting on you' when creative_lead views creative work", () => {
    expect(ownerLabelFor("creative", "creative_lead")).toBe("Waiting on you");
  });

  it("falls back to a generic label for unrelated viewer roles", () => {
    expect(ownerLabelFor("qa", "creative_lead")).toBe("Waiting on QA");
  });

  it("phrases AE work with the AE label for non-AE viewers", () => {
    expect(ownerLabelFor("ae", "customer_admin")).toBe(
      "Waiting on your account manager"
    );
    expect(ownerLabelFor("ae", "events_lead")).toBe("Waiting on you");
  });
});

describe("ownerForMilestone", () => {
  const milestoneId = "m1";

  it("returns null when no blocking incomplete task exists", () => {
    const tasks = [makeTask({ milestoneId, isBlocking: false })];
    expect(ownerForMilestone(milestoneId, tasks)).toBeNull();
  });

  it("returns null when all blocking tasks are complete", () => {
    const tasks = [
      makeTask({ milestoneId, isBlocking: true, status: "complete" }),
    ];
    expect(ownerForMilestone(milestoneId, tasks)).toBeNull();
  });

  it("maps an internal task to its category's team", () => {
    const tasks = [
      makeTask({ milestoneId, isBlocking: true, taskType: "internal_action", category: "creative", status: "pending" }),
    ];
    expect(ownerForMilestone(milestoneId, tasks)).toBe("creative");
  });

  it("ignores tasks on other milestones", () => {
    const tasks = [
      makeTask({ milestoneId: "other", isBlocking: true, category: "creative", status: "pending" }),
    ];
    expect(ownerForMilestone(milestoneId, tasks)).toBeNull();
  });

  it("attributes a customer_action to the customer even in a Bright.Blue work area", () => {
    const tasks = [
      // "Upload brand guidelines" is creative-category work, but the customer owns it.
      makeTask({ milestoneId, isBlocking: true, taskType: "customer_action", category: "creative", status: "pending" }),
    ];
    expect(ownerForMilestone(milestoneId, tasks)).toBe("customer");
  });
});

describe("groupOpenTasksByOwner", () => {
  it("excludes complete and skipped tasks", () => {
    const tasks = [
      makeTask({ status: "complete", category: "creative" }),
      makeTask({ status: "skipped", category: "creative" }),
    ];
    expect(groupOpenTasksByOwner(tasks)).toEqual([]);
  });

  it("groups by owner and returns them in canonical order", () => {
    const tasks = [
      makeTask({ status: "pending", taskType: "internal_action", category: "qa" }),
      makeTask({ status: "pending", taskType: "customer_action", category: "creative" }),
      makeTask({ status: "pending", taskType: "internal_action", category: "creative" }),
      makeTask({ status: "pending", taskType: "internal_action", category: "operations" }),
    ];
    const buckets = groupOpenTasksByOwner(tasks);
    expect(buckets.map((b) => b.owner)).toEqual([
      "customer",
      "creative",
      "operations",
      "qa",
    ]);
  });

  it("buckets every customer_action under the customer regardless of work area", () => {
    const tasks = [
      makeTask({ id: "t1", status: "pending", taskType: "customer_action", category: "creative" }),
      makeTask({ id: "t2", status: "pending", taskType: "customer_action", category: "operations" }),
      makeTask({ id: "t3", status: "pending", taskType: "customer_action", category: "logistics" }),
    ];
    const buckets = groupOpenTasksByOwner(tasks);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].owner).toBe("customer");
    expect(buckets[0].tasks).toHaveLength(3);
  });

  it("collects all internal tasks for a given team into one bucket", () => {
    const tasks = [
      makeTask({ id: "t1", status: "pending", taskType: "internal_action", category: "creative" }),
      makeTask({ id: "t2", status: "pending", taskType: "internal_action", category: "creative" }),
      makeTask({ id: "t3", status: "pending", taskType: "internal_action", category: "qa" }),
    ];
    const buckets = groupOpenTasksByOwner(tasks);
    expect(buckets).toHaveLength(2);
    expect(buckets.find((b) => b.owner === "creative")?.tasks).toHaveLength(2);
  });
});
