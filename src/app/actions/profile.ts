"use server";

/** Server action for user profile updates. */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { profileNameSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/types/actions";

/** Update the current user's display name. */
export async function updateProfileName(name: string): Promise<ActionResult> {
  const parsed = profileNameSchema.safeParse({ name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

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
