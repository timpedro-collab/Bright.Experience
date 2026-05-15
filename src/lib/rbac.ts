/** Role-based access control helpers wrapping Supabase auth */
import type { UserRole } from "@/types";
import { getUser } from "@/lib/auth";

const INTERNAL_ROLES: UserRole[] = [
  "events_lead",
  "creative_lead",
  "operations_lead",
  "qa_lead",
  "developer",
  "admin",
];

const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  "events.read": [...INTERNAL_ROLES, "customer_user", "customer_admin"],
  "events.write": INTERNAL_ROLES,
  "events.create": ["events_lead", "admin"],
  "approvals.decide": [...INTERNAL_ROLES, "customer_admin"],
  "assets.upload": [...INTERNAL_ROLES, "customer_user", "customer_admin"],
  "studio.manage": ["creative_lead", "admin"],
  "studio.order": [...INTERNAL_ROLES, "customer_admin"],
  "templates.manage": ["events_lead", "admin"],
  "quotes.manage": ["events_lead", "admin"],
  "partners.manage": ["admin"],
  "catalog.manage": ["admin", "creative_lead"],
};

/** Check if a role is an internal (non-customer) role */
export function isInternal(role: UserRole): boolean {
  return INTERNAL_ROLES.includes(role);
}

/** Check if a role has the given permission */
export function hasPermission(role: UserRole, permission: string): boolean {
  const allowed = ROLE_PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/** Server-side guard: reject if the current user lacks the required role */
export async function requireRole(requiredRoles: UserRole[]): Promise<void> {
  const user = await getUser();
  if (!user || !requiredRoles.includes(user.role)) {
    throw new Error("Forbidden: insufficient role");
  }
}

/** Server-side guard: reject if the current user lacks the required permission */
export async function requirePermission(permission: string): Promise<void> {
  const user = await getUser();
  if (!user || !hasPermission(user.role, permission)) {
    throw new Error("Forbidden: insufficient permission");
  }
}
