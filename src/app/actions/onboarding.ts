"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/actions";

export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ has_completed_onboarding: true })
    .eq("id", user.id);

  if (error) return { success: false, error: "Could not update profile." };
  return { success: true, data: undefined };
}
