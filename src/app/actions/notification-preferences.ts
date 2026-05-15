"use server";

/**
 * Per-archetype notification preferences for the current user.
 *
 * Class A archetypes (`action_required`) ignore the stored `in_portal`
 * value at the application layer — the in-portal lane is unconditionally
 * always-on. We still persist whatever the caller sends so the row stays
 * a faithful record of what the UI showed, but the dispatcher will not
 * consult it for Class A. See `archetypes.ts` for the policy.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { ARCHETYPES } from "@/lib/notifications/archetypes";

const updateSchema = z.object({
  kind: z.string().min(1),
  emailMode: z.enum(["immediate", "digest", "off"]),
  /** Class B archetypes only — Class A ignored at the app layer. */
  inPortal: z.boolean().optional(),
});

export async function updateNotificationPreference(input: unknown) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid payload" };
  }
  const { kind, emailMode, inPortal } = parsed.data;

  const archetype = ARCHETYPES[kind as keyof typeof ARCHETYPES];
  if (!archetype) {
    return { success: false as const, error: "Unknown notification kind" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const effectiveInPortal =
    archetype.classOf === "action_required" ? true : (inPortal ?? true);

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    kind,
    email_mode: emailMode,
    in_portal: effectiveInPortal,
    updated_at: new Date().toISOString(),
  });

  if (error) return { success: false as const, error: error.message };

  revalidatePath("/settings/notifications");
  return { success: true as const };
}
