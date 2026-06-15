"use server";

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Bump the current user's streak. Called after meaningful actions
 * (task complete, asset upload, briefing submit, QA pass, etc.).
 *
 * Logic:
 *  - If last_active_date is today → no-op (already counted today).
 *  - If last_active_date is yesterday → increment streak.
 *  - Otherwise → reset to 1 (streak broken, starting fresh).
 */
export async function bumpStreak(): Promise<{
  streak: number;
  isNew: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { streak: 0, isNew: false };

  const db = getServiceRoleClient();
  const { data: profile } = await db
    .from("profiles")
    .select("current_streak, last_active_date")
    .eq("id", user.id)
    .single();

  if (!profile) return { streak: 0, isNew: false };

  const today = new Date().toISOString().split("T")[0];
  const last = profile.last_active_date;

  if (last === today) {
    return { streak: profile.current_streak ?? 0, isNew: false };
  }

  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .split("T")[0];

  const newStreak = last === yesterday ? (profile.current_streak ?? 0) + 1 : 1;

  await db
    .from("profiles")
    .update({ current_streak: newStreak, last_active_date: today })
    .eq("id", user.id);

  return { streak: newStreak, isNew: true };
}

/** Read the current streak without mutating. */
export async function getStreak(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data } = await supabase
    .from("profiles")
    .select("current_streak, last_active_date")
    .eq("id", user.id)
    .single();

  if (!data) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .split("T")[0];

  if (
    data.last_active_date === today ||
    data.last_active_date === yesterday
  ) {
    return data.current_streak ?? 0;
  }
  return 0;
}
