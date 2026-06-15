"use server";

/** Server action for user profile updates. */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

/** Update the current user's display name. */
export async function updateProfileName(name: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!name.trim() || name.trim().length < 2) {
    return { success: false, error: "Name must be at least 2 characters" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: name.trim() })
    .eq("id", user.id);

  if (error) return { success: false, error: `Failed to update profile: ${error.message}` };

  revalidatePath("/settings/profile");
  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true, data: undefined };
}
