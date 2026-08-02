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

/**
 * Team-facing label for the owner, used on internal surfaces (e.g. the
 * deadline timeline) where "you" / "your account manager" customer phrasing
 * would read oddly. Names the responsible team in the third person.
 */
const OWNER_TEAM_LABEL: Record<OwnerRole, string> = {
  customer: "Customer",
  creative: "Bright.Blue creative",
  operations: "Operations",
  qa: "QA",
  development: "Development",
  logistics: "Logistics",
  reporting: "Reporting",
  ae: "Account manager",
};

/** Customer roles see "Waiting on you" when the role is `customer`. */
const CUSTOMER_ROLES: UserRole[] = ["customer_user", "customer_admin"];

const OWNER_TO_INTERNAL_ROLE: Partial<Record<OwnerRole, UserRole[]>> = {
  creative: ["creative_lead"],
  operations: ["operations_lead"],
  qa: ["qa_lead"],
  development: ["admin"],
  logistics: ["operations_lead"],
  reporting: ["events_lead"],
  ae: ["events_lead"],
};

/** True when the viewer's own role is the party responsible for this work. */
function isOwnedByViewer(owner: OwnerRole, viewerRole: UserRole): boolean {
  if (owner === "customer") return CUSTOMER_ROLES.includes(viewerRole);
  const internalRoles = OWNER_TO_INTERNAL_ROLE[owner];
  return !!internalRoles && internalRoles.includes(viewerRole);
}

/**
 * Phrase the owner for a viewer. When the viewer's role matches the
 * owner, returns the "you" variant.
 */
export function ownerLabelFor(
  owner: OwnerRole,
  viewerRole: UserRole
): string {
  if (isOwnedByViewer(owner, viewerRole)) {
    return "Waiting on you";
  }
  return `Waiting on ${OWNER_LABEL[owner]}`;
}

/**
 * THE single, canonical "whose move is it?" resolver for every surface
 * (timeline, checklist, ownership panel, deadlines, dashboards). One
 * vocabulary everywhere: "Awaiting you" when it's the viewer's, otherwise
 * "Awaiting {party}". `isYou` drives the loud accent treatment.
 */
export interface OwnerBadgeInfo {
  /** Full phrase, e.g. "Awaiting you" / "Awaiting Operations". */
  label: string;
  /** Short party name without the "Awaiting" prefix, e.g. "You" / "Operations". */
  party: string;
  /** Whether the work sits with the viewer right now. */
  isYou: boolean;
  owner: OwnerRole;
}

export function resolveOwnerBadge(
  owner: OwnerRole,
  viewerRole: UserRole | undefined,
  isInternal: boolean
): OwnerBadgeInfo {
  const isYou = viewerRole ? isOwnedByViewer(owner, viewerRole) : false;
  if (isYou) {
    return { label: "Awaiting you", party: "You", isYou: true, owner };
  }
  if (owner === "customer") {
    const party = isInternal ? "the customer" : "your team";
    return { label: `Awaiting ${party}`, party: isInternal ? "Customer" : "Your team", isYou: false, owner };
  }
  // Internal team owners — third-person team name for staff, friendlier
  // customer-facing phrasing for customers.
  const party = isInternal ? OWNER_TEAM_LABEL[owner] : OWNER_LABEL[owner];
  return { label: `Awaiting ${party}`, party, isYou: false, owner };
}

/** Convenience: resolve a badge straight from a task. */
export function ownerBadgeForTask(
  task: Task,
  viewerRole: UserRole | undefined,
  isInternal: boolean
): OwnerBadgeInfo {
  return resolveOwnerBadge(ownerForTask(task), viewerRole, isInternal);
}

/**
 * Resolve the responsible party for a single task.
 *
 * `task_type` is the primary signal: a `customer_action` is ALWAYS owned by
 * the customer, regardless of which work area (`category`) it touches —
 * "upload your brand guidelines" is a creative-category task but the
 * customer owns it, not Bright.Blue creative. Only internal work falls
 * through to the category → team mapping.
 */
export function ownerForTask(task: Task): OwnerRole {
  if (task.taskType === "customer_action") return "customer";
  return CATEGORY_TO_OWNER[task.category] ?? "ae";
}

/**
 * Same resolution as {@link ownerForTask} but for a raw DB row, where the
 * task type and category arrive as loose strings (e.g. from a deadline query
 * that doesn't hydrate a full `Task`).
 */
export function ownerForTaskRow(
  taskType: string | null | undefined,
  category: string | null | undefined
): OwnerRole {
  if (taskType === "customer_action") return "customer";
  return CATEGORY_TO_OWNER[category as TaskCategory] ?? "ae";
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
  return ownerForTask(blocking);
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
    const owner = ownerForTask(t);
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
export const OWNER_TEAM_DISPLAY_LABEL = OWNER_TEAM_LABEL;
