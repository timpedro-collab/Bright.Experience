"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileName(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!name.trim() || name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: name.trim() })
    .eq("id", user.id);

  if (error) throw new Error(`Failed to update profile: ${error.message}`);

  revalidatePath("/settings/profile");
  revalidatePath("/settings");
  revalidatePath("/");
}
