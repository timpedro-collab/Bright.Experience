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
  "stages.advance": ["events_lead", "admin", "developer"],
  // Customer sign-off is the customer's call. The only internal roles that
  // may record it on their behalf are the customer-facing ones — Events
  // Lead, Creative, admin/developer. Ops and QA never touch sign-off.
  "approvals.decide": [
    "events_lead",
    "creative_lead",
    "admin",
    "developer",
    "customer_admin",
  ],
  // Reviewing the creative assets a customer uploads belongs to the
  // Creative team (+ admin/developer break-glass).
  "assets.review": ["creative_lead", "admin", "developer"],
  "assets.upload": [...INTERNAL_ROLES, "customer_user", "customer_admin"],
  "studio.manage": ["creative_lead", "admin"],
  "studio.order": [...INTERNAL_ROLES, "customer_admin"],
  "templates.manage": ["events_lead", "admin"],
  "quotes.manage": ["events_lead", "admin"],
  "partners.manage": ["admin"],
  "catalog.manage": ["admin", "creative_lead"],
  // Partner portal surfaces (referral link, pipeline, commissions). Internal
  // admins can view for support; partners see their own (data-scoped by slug).
  "partner.portal": ["partner_member", "partner_admin", "admin", "events_lead"],
  "partner.commissions.manage": ["partner_admin", "admin"],
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
