/**
 * Customer invite internals.
 *
 * Server-only, not a Server Action. Sending an invite creates an auth user and
 * a profile row bound to an account, so exposing this ungated let anyone attach
 * themselves to any tenant as `customer_admin`. The system path exists for flows
 * that have already authorised the operation by other means (an accepted quote,
 * a verified booking), and every caller must do that authorising itself.
 */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { inviteCustomerUserSystemSchema } from "@/lib/validations/invites";

export type InviteRole = "customer_admin" | "customer_user";

export interface InviteResult {
  success: boolean;
  error?: string;
}

const VALID_ROLES: InviteRole[] = ["customer_admin", "customer_user"];

/**
 * Invite a customer user and bootstrap their profile against `accountId`.
 *
 * The profile is upserted with the service role straight after the invite
 * because the `handle_new_auth_user` trigger deliberately no longer trusts
 * auth metadata for role or account (see
 * supabase/migrations/20260728000000_profile_bootstrap_app_metadata.sql).
 */
export async function inviteCustomerUserInternal(
  email: string,
  accountId: string,
  role: InviteRole
): Promise<InviteResult> {
  if (!email || !accountId || !role) {
    return { success: false, error: "Email, account, and role are required." };
  }

  const parsed = inviteCustomerUserSystemSchema.safeParse({
    email,
    accountId,
    role,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  if (!VALID_ROLES.includes(role)) {
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
    console.error("[Invites] inviteCustomerUserInternal failed:", message);
    return { success: false, error: message };
  }
}
