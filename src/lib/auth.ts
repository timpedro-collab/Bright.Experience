"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/bootstrap";
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
    };
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    accountId: profile.account_id,
  };
}
