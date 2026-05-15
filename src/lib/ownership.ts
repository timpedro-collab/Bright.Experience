/**
 * Helpers that translate the open work on an event into a human label
 * showing whose plate the work sits on. Used by the timeline and the
 * `EventOwnershipPanel`.
 *
 * The mapping is intentionally simple: every `task.category` maps to a
 * specific Bright.Blue side (or to the customer for category `admin`,
 * which is what customer-visible checklist tasks land in). When the
 * viewer's role lines up with the owner, the panel says "Waiting on you"
 * — that single piece of personalised copy is the difference between a
 * status badge and a call to action.
 */

import type { Task, TaskCategory, UserRole } from "@/types";

export type OwnerRole =
  | "customer"
  | "creative"
  | "operations"
  | "qa"
  | "development"
  | "logistics"
  | "reporting"
  | "ae";

/**
 * Map a task's category to its responsible team. `admin` is customer-side
 * by convention because it's where customer-action checklist tasks sit.
 */
const CATEGORY_TO_OWNER: Record<TaskCategory, OwnerRole> = {
  creative: "creative",
  operations: "operations",
  qa: "qa",
  development: "development",
  logistics: "logistics",
  reporting: "reporting",
  admin: "customer",
};

const OWNER_LABEL: Record<OwnerRole, string> = {
  customer: "you",
  creative: "Bright.Blue creative",
  operations: "Operations",
  qa: "QA",
  development: "Development",
  logistics: "Logistics",
  reporting: "Reporting",
  ae: "your account manager",
};

/** Customer roles see "Waiting on you" when the role is `customer`. */
const CUSTOMER_ROLES: UserRole[] = ["customer_user", "customer_admin"];

const OWNER_TO_INTERNAL_ROLE: Partial<Record<OwnerRole, UserRole[]>> = {
  creative: ["creative_lead"],
  operations: ["operations_lead"],
  qa: ["qa_lead"],
  development: ["developer"],
  ae: ["events_lead"],
};

/**
 * Phrase the owner for a viewer. When the viewer's role matches the
 * owner, returns the "you" variant.
 */
export function ownerLabelFor(
  owner: OwnerRole,
  viewerRole: UserRole
): string {
  if (owner === "customer" && CUSTOMER_ROLES.includes(viewerRole)) {
    return "Waiting on you";
  }
  const internalRoles = OWNER_TO_INTERNAL_ROLE[owner];
  if (internalRoles && internalRoles.includes(viewerRole)) {
    return "Waiting on you";
  }
  return `Waiting on ${OWNER_LABEL[owner]}`;
}

/**
 * Compute the owner for a milestone from its first blocking incomplete
 * task. Returns `null` for milestones that are already complete or that
 * have no open blocking work (i.e. the milestone is implicitly waiting
 * on the AE to move it forward).
 */
export function ownerForMilestone(
  milestoneId: string,
  tasks: Task[]
): OwnerRole | null {
  const blocking = tasks.find(
    (t) =>
      t.milestoneId === milestoneId &&
      t.isBlocking &&
      t.status !== "complete" &&
      t.status !== "skipped"
  );
  if (!blocking) return null;
  return CATEGORY_TO_OWNER[blocking.category] ?? "ae";
}

interface OwnershipBucket {
  owner: OwnerRole;
  tasks: Task[];
}

/**
 * Group an event's open tasks by current owner role. Used by the panel
 * on the event overview ("Right now, here's where things sit").
 */
export function groupOpenTasksByOwner(tasks: Task[]): OwnershipBucket[] {
  const open = tasks.filter(
    (t) => t.status !== "complete" && t.status !== "skipped"
  );
  const map = new Map<OwnerRole, Task[]>();
  for (const t of open) {
    const owner = CATEGORY_TO_OWNER[t.category] ?? "ae";
    const bucket = map.get(owner) ?? [];
    bucket.push(t);
    map.set(owner, bucket);
  }
  // Order: customer → creative → operations → qa → dev → logistics → reporting → ae
  const order: OwnerRole[] = [
    "customer",
    "creative",
    "operations",
    "qa",
    "development",
    "logistics",
    "reporting",
    "ae",
  ];
  return order
    .filter((o) => map.has(o))
    .map((owner) => ({ owner, tasks: map.get(owner) ?? [] }));
}

export const OWNER_DISPLAY_LABEL = OWNER_LABEL;
