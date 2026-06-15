"use server";

/**
 * Region-anchored annotations on an asset version. Reviewers drop a pin/box
 * (coordinates as a % of the rendered preview) with a note; the customer reads
 * them inline so feedback is unambiguous and tied to a spot on the creative.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { isInternal } from "@/lib/notifications/roles";
import type { ActionResult } from "@/types/actions";

const addSchema = z.object({
  assetId: z.string().uuid(),
  eventId: z.string().uuid(),
  assetVersionId: z.string().uuid().optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0).max(100).default(0),
  h: z.number().min(0).max(100).default(0),
  body: z.string().trim().min(1).max(2000),
});

export async function addAssetAnnotation(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid annotation payload" };
  }
  const { assetId, eventId, assetVersionId, x, y, w, h, body } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!isInternal(profile?.role)) {
    return { success: false, error: "Reviewer role required" };
  }

  const { data, error } = await supabase
    .from("asset_annotations")
    .insert({
      asset_id: assetId,
      event_id: eventId,
      asset_version_id: assetVersionId ?? null,
      author_id: user.id,
      x,
      y,
      w,
      h,
      body,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/asset-reviews");
  revalidatePath(`/events/${eventId}/assets`);
  return { success: true, data: { id: String(data.id) } };
}

export async function resolveAssetAnnotation(
  annotationId: string,
  eventId: string,
  resolved: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("asset_annotations")
    .update({ resolved })
    .eq("id", annotationId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/asset-reviews");
  revalidatePath(`/events/${eventId}/assets`);
  return { success: true, data: undefined };
}
