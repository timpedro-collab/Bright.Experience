"use server";

/** Admin actions for managing user profiles and accounts. */

import { requireInternalUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/actions";

/** Toggle a user's is_active flag. Internal-only. */
export async function toggleUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireInternalUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/** Update an account's name. Internal-only. */
export async function updateAccountName(
  accountId: string,
  name: string,
): Promise<ActionResult> {
  await requireInternalUser();
  if (!name.trim()) return { success: false, error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ name: name.trim() })
    .eq("id", accountId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
