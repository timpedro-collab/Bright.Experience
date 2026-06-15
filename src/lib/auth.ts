"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/bootstrap";
import { isInternalRole } from "@/lib/roles";
import type { User } from "@/types";

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  // Lazy bootstrap — covers password-based logins that bypass the
  // OAuth callback. The DB trigger is the primary path; this is the
  // safety net.
  if (!profile) {
    await ensureProfile(supabase, {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    });
    const { data: created } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();
    if (!created) return null;
    return {
      id: created.id,
      name: created.name,
      email: created.email,
      avatarUrl: created.avatar_url,
      role: created.role,
      accountId: created.account_id,
      hasCompletedOnboarding: Boolean(created.has_completed_onboarding),
    };
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    accountId: profile.account_id,
    hasCompletedOnboarding: Boolean(profile.has_completed_onboarding),
  };
}

/** Verify the caller is authenticated and holds an internal role; throws otherwise. */
export async function requireInternalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !isInternalRole(profile.role)) {
    throw new Error("Forbidden: internal access only");
  }

  return { supabase, user, profile };
}
