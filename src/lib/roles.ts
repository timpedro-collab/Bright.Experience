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
