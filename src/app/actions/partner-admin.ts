"use server";

/**
 * Internal setup for partner organisations of any type.
 *
 * `invitePartnerUser` is the generic sibling of `inviteOrganizerUser`
 * (./organizer-admin.ts): it emails an invite to one of the partner's own
 * people and writes the two rows every partner portal checks — a `profiles`
 * row carrying a partner role, and a `partner_users` membership tying them to
 * the partner. Unlike the organizer version it accepts any partner type
 * (venue, agency, reseller, referral, organizer), so the admin partner detail
 * page no longer needs a pasted profile UUID to give someone access.
 */

import { revalidatePath } from "next/cache";

import { requireInternalUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import {
  invitePartnerUserSchema,
  type PartnerUserRole,
} from "@/lib/validations/partners";

/**
 * Invite one of a partner's own people into their portal.
 *
 * Works for every partner type. Someone already on the platform keeps their
 * existing login and only gains the membership row; a new person gets an
 * auth invite email and a bootstrapped profile.
 */
export async function invitePartnerUser(
  partnerId: string,
  email: string,
  role: PartnerUserRole
) {
  const parsed = invitePartnerUserSchema.safeParse({ partnerId, email, role });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

  const { data: partner } = await supabase
    .from("partners")
    .select("id, type, name")
    .eq("id", partnerId)
    .maybeSingle();
  if (!partner) {
    return { success: false as const, error: "That partner doesn't exist" };
  }

  const normalisedEmail = parsed.data.email.toLowerCase();

  // Creating the auth user and writing a profile both need to bypass RLS.
  const { getServiceRoleClient } = await import("@/lib/supabase/service-role");
  const admin = getServiceRoleClient();

  // Someone already on the platform (an internal colleague, or a person who
  // works for two partners) keeps their existing login; they only need the
  // membership row.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", normalisedEmail)
    .maybeSingle();

  let profileId = existingProfile?.id as string | undefined;

  if (!profileId) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
      normalisedEmail,
      {
        data: { partner_id: partnerId, role: parsed.data.role },
        redirectTo: `${siteUrl}/auth/callback?next=/auth/set-password`,
      }
    );
    if (authError) {
      return { success: false as const, error: authError.message };
    }
    profileId = authData?.user?.id as string | undefined;
    if (!profileId) {
      return { success: false as const, error: "Invitation sent but no user was created." };
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: profileId,
        email: normalisedEmail,
        name: normalisedEmail.split("@")[0],
        role: parsed.data.role,
        is_active: true,
      },
      { onConflict: "id" }
    );
    if (profileError) {
      console.error("[partner-admin] profile upsert failed:", profileError.message);
      return { success: false as const, error: "Invitation sent but the profile wasn't created." };
    }
  }

  const { data: membership } = await supabase
    .from("partner_users")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) {
    const { error: membershipError } = await supabase.from("partner_users").insert({
      partner_id: partnerId,
      profile_id: profileId,
      // `partner_users.role` is the coarse membership grade; the fine-grained
      // permission comes from the profile role above.
      role: parsed.data.role === "partner_admin" ? "admin" : "member",
    });
    if (membershipError) {
      return { success: false as const, error: "Couldn't give them access to this partner" };
    }
  }

  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
  return {
    success: true as const,
    data: { profileId, existingUser: Boolean(existingProfile) },
  };
}
