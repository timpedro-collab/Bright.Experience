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
