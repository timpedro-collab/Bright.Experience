"use server";

/**
 * Server actions for inviting customer users to the platform.
 *
 * Uses the Supabase Admin API to send magic-link invitations and
 * bootstraps a profile row so the new user lands in the right account
 * with the right role on first login.
 */

import { requireInternalUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  inviteCustomerUserSchema,
  inviteCustomerUserSystemSchema,
} from "@/lib/validations/invites";

export type InviteRole = "customer_admin" | "customer_user";

interface InviteResult {
  success: boolean;
  error?: string;
}

/**
 * Invite a customer user by email — creates a Supabase auth user via the
 * Admin invite flow and inserts a matching profile row.
 *
 * Gated to internal users only.
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

  if (!email || !accountId || !role) {
    return { success: false, error: "Email, account, and role are required." };
  }

  const parsed = inviteCustomerUserSchema.safeParse({ email, accountId, role });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const validRoles: InviteRole[] = ["customer_admin", "customer_user"];
  if (!validRoles.includes(role)) {
    return { success: false, error: `Invalid role: ${role}` };
  }

  try {
    const supabase = getServiceRoleClient();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { account_id: accountId, role },
        redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
      });

    if (authError) {
      return { success: false, error: authError.message };
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: "Invitation sent but no user ID returned." };
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        name: email.split("@")[0],
        role,
        account_id: accountId,
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("[Invites] Profile insert failed:", profileError.message);
      return {
        success: false,
        error: "Invitation sent but profile creation failed.",
      };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Invites] inviteCustomerUser failed:", message);
    return { success: false, error: message };
  }
}

/**
 * System-level invite — bypasses the `requireInternalUser()` gate.
 *
 * Called by automated flows (e.g. `provisionEventFromQuote`) where there
 * is no authenticated user in the request context but the operation has
 * already been authorised by the system.
 */
export async function inviteCustomerUserSystem(
  email: string,
  accountId: string,
  role: InviteRole
): Promise<InviteResult> {
  if (!email || !accountId || !role) {
    return { success: false, error: "Email, account, and role are required." };
  }

  const parsed = inviteCustomerUserSystemSchema.safeParse({ email, accountId, role });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const validRoles: InviteRole[] = ["customer_admin", "customer_user"];
  if (!validRoles.includes(role)) {
    return { success: false, error: `Invalid role: ${role}` };
  }

  try {
    const supabase = getServiceRoleClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { account_id: accountId, role },
        redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
      });

    if (authError) {
      return { success: false, error: authError.message };
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: "Invitation sent but no user ID returned." };
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        name: email.split("@")[0],
        role,
        account_id: accountId,
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("[Invites] Profile insert failed:", profileError.message);
      return {
        success: false,
        error: "Invitation sent but profile creation failed.",
      };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Invites] inviteCustomerUserSystem failed:", message);
    return { success: false, error: message };
  }
}
