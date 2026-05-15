/**
 * Internal role list as a runtime array — kept separate from
 * `@/lib/roles` so we don't have to import server-only code into
 * isomorphic notification utilities.
 */

import type { UserRole } from "@/types";

export const INTERNAL_ROLE_LIST: UserRole[] = [
  "events_lead",
  "creative_lead",
  "operations_lead",
  "qa_lead",
  "developer",
  "admin",
];

export function isInternal(role: string | null | undefined): boolean {
  if (!role) return false;
  return (INTERNAL_ROLE_LIST as string[]).includes(role);
}
