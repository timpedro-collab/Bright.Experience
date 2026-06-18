"use server";

/** Admin actions for managing user profiles and accounts. */

import { requireInternalUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/actions";

/** Toggle a user's is_active flag. Admin-only. */
export async function toggleUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false, error: "Forbidden: admin access only" };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/** Update an account's name. Admin-only. */
export async function updateAccountName(
  accountId: string,
  name: string,
): Promise<ActionResult> {
  const { profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false, error: "Forbidden: admin access only" };
  }
  if (!name.trim()) return { success: false, error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ name: name.trim() })
    .eq("id", accountId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
