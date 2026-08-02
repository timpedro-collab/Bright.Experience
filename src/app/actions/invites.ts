"use server";

/**
 * Server actions for inviting customer users to the platform.
 *
 * Only the admin-gated entry point lives here. The service-role body is in
 * `src/server/invites.ts`: an unauthenticated variant used to be exported from
 * this file, which made "add yourself to any account as customer_admin" a public
 * endpoint.
 */

import { requireInternalUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { inviteCustomerUserSchema } from "@/lib/validations/invites";
import {
  inviteCustomerUserInternal,
  type InviteResult,
  type InviteRole,
} from "@/server/invites";

// Re-exported straight from the source module: a local `export type { X }` in
// a "use server" file becomes a runtime re-export of an erased binding and
// throws when the actions loader evaluates it.
export type { InviteRole } from "@/server/invites";

/**
 * Invite a customer user by email — creates a Supabase auth user via the
 * Admin invite flow and inserts a matching profile row.
 *
 * Gated to internal admins only.
 */
export async function inviteCustomerUser(
  email: string,
  accountId: string,
  role: InviteRole
): Promise<InviteResult> {
  try {
    const { profile } = await requireInternalUser();
    if (!isAdminRole(profile.role)) {
      return { success: false, error: "Forbidden: admin access only" };
    }
  } catch {
    return { success: false, error: "Forbidden: internal access only" };
  }

  const parsed = inviteCustomerUserSchema.safeParse({ email, accountId, role });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  return inviteCustomerUserInternal(email, accountId, role);
}
