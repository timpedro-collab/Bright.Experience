import type { UserRole } from "@/types";

const INTERNAL_ROLES: UserRole[] = [
  "events_lead",
  "creative_lead",
  "operations_lead",
  "qa_lead",
  "developer",
  "admin",
];

export function isInternalRole(role: UserRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

/** Only admin and events_lead can access sensitive admin surfaces (users, API keys, invites). */
export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "events_lead";
}

/**
 * Roles allowed to move an event through the delivery pipeline. Specialist
 * roles (creative, ops, QA) complete their own work but do not advance the
 * stage — orchestration stays with the Events Lead / Admin.
 */
export const STAGE_ADVANCE_ROLES: UserRole[] = ["events_lead", "admin", "developer"];

export function canAdvanceEventStage(role: UserRole): boolean {
  return STAGE_ADVANCE_ROLES.includes(role);
}

/**
 * Creative ownership.
 *
 * Reviewing the creative assets a customer uploads (approve / request a
 * revision / hand to Bright.Studio) is the Creative team's job — NOT the
 * Events Lead's and NOT Ops'. `admin` and `developer` retain access as
 * org-owner / break-glass roles, but the orchestrator (events_lead) and
 * the specialist lanes (operations_lead, qa_lead) cannot action creative.
 */
export const CREATIVE_REVIEW_ROLES: UserRole[] = [
  "creative_lead",
  "admin",
  "developer",
];

export function canReviewCreativeAssets(role: UserRole): boolean {
  return CREATIVE_REVIEW_ROLES.includes(role);
}

/**
 * Who may OPEN the creative review queue. The actioners above, plus the
 * Events Lead for read-only oversight (they orchestrate the event and need
 * to see where creative sign-off sits, but cannot decide it).
 */
export const CREATIVE_QUEUE_VIEW_ROLES: UserRole[] = [
  ...CREATIVE_REVIEW_ROLES,
  "events_lead",
];

export function canViewCreativeQueue(role: UserRole): boolean {
  return CREATIVE_QUEUE_VIEW_ROLES.includes(role);
}

/**
 * Customer sign-off is the customer's decision. The only internal roles
 * that may record it on the customer's behalf are the customer-facing
 * ones — the Events Lead (account manager) and the Creative team that
 * produced the deliverable, plus admin/developer. Ops and QA never touch
 * sign-off.
 */
export const ON_BEHALF_APPROVAL_ROLES: UserRole[] = [
  "events_lead",
  "creative_lead",
  "admin",
  "developer",
];

export function canRecordApprovalOnBehalf(role: UserRole): boolean {
  return ON_BEHALF_APPROVAL_ROLES.includes(role);
}

/**
 * Back-office ownership.
 *
 * The internal admin surfaces are NOT a single bucket. Each belongs to a
 * specific function, and the specialist lanes (Ops, QA) shouldn't wander
 * into commercial or creative back-office that isn't theirs. `developer`
 * is retained everywhere as a break-glass full-stack role.
 */

/**
 * Commercial / account-management surfaces: quotes, invoices, the customer
 * success queue, task templates, campaigns, benchmarks, recommendations,
 * and partner management. Owned by the Events Lead (account manager) + Admin.
 */
export const COMMERCIAL_ROLES: UserRole[] = ["events_lead", "admin", "developer"];

export function canViewCommercial(role: UserRole): boolean {
  return COMMERCIAL_ROLES.includes(role);
}

/**
 * Creative / product back-office: the Catalog (machines, games, case
 * studies, packages, placements) and the Bright.Studio orders page. Owned
 * by Creative, with the Events Lead for oversight + Admin.
 */
export const CREATIVE_PRODUCT_ROLES: UserRole[] = [
  "creative_lead",
  "events_lead",
  "admin",
  "developer",
];

export function canViewCreativeProduct(role: UserRole): boolean {
  return CREATIVE_PRODUCT_ROLES.includes(role);
}

/**
 * Locations (venues / delivery addresses) — logistics-adjacent. Owned by
 * Ops, with the Events Lead + Admin.
 */
export const LOCATIONS_ROLES: UserRole[] = [
  "operations_lead",
  "events_lead",
  "admin",
  "developer",
];

export function canViewLocations(role: UserRole): boolean {
  return LOCATIONS_ROLES.includes(role);
}

/**
 * Reseller / partner roles. Partners live outside the internal org: they
 * sell through the platform and see only their own co-branded portal, never
 * the internal event machinery. Access to a specific partner's surfaces is
 * still data-scoped (partner-slug match), but these helpers let us reason
 * about the role class consistently.
 */
export const PARTNER_ROLES: UserRole[] = ["partner_member", "partner_admin"];

export function isPartnerRole(role: UserRole): boolean {
  return PARTNER_ROLES.includes(role);
}

export function isPartnerAdmin(role: UserRole): boolean {
  return role === "partner_admin";
}
