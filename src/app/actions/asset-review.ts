"use server";

/**
 * Bright.Blue-side review decision for a customer-uploaded asset.
 *
 * Internal-only — the RLS policies on `assets` already gate writes to
 * internal roles, but we also short-circuit at the application layer so
 * a wandering customer browser can't accidentally hit it through a
 * mis-shared `<form>` reference.
 *
 * On `approved`:
 *   - status flips to `accepted`, review_status to `approved`
 *   - dispatches `asset.review_approved` to the customer admins
 *
 * On `revision_requested`:
 *   - status flips to `rejected` (customer sees the "needs work" badge)
 *   - review_status flips to `revision_requested`, revision_count++
 *   - dispatches `asset.revision_requested` with the feedback inline so
 *     the customer reads exactly what the reviewer wrote
 *
 * Both branches also write an audit row so the timeline + admin queue
 * carry the decision history.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { canReviewCreativeAssets } from "@/lib/roles";
import { enqueueAssetReviewDecision } from "@/lib/pipedrive/triggers";
import type { UserRole } from "@/types";

const submitReviewSchema = z.object({
  assetId: z.string().uuid(),
  decision: z.enum(["approved", "revision_requested"]),
  feedback: z.string().max(2000).optional(),
});

export async function submitAssetReview(input: unknown) {
  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid review payload" };
  }
  const { assetId, decision, feedback } = parsed.data;

  if (decision === "revision_requested" && !feedback?.trim()) {
    return {
      success: false as const,
      error: "Add a short note so the customer knows what to change.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const { data: reviewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const reviewerRole = reviewerProfile?.role as UserRole | undefined;
  // Creative sign-off belongs to the Creative team (+ admin).
  // Events Lead, Ops and QA cannot decide on creative assets.
  if (!reviewerRole || !canReviewCreativeAssets(reviewerRole)) {
    return {
      success: false as const,
      error: "Only the Creative team can review creative assets.",
    };
  }

  const { data: existing } = await supabase
    .from("assets")
    .select("event_id, name, revision_count")
    .eq("id", assetId)
    .single();
  if (!existing) {
    return { success: false as const, error: "Asset not found" };
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    review_status:
      decision === "approved" ? "approved" : "revision_requested",
    review_decided_by: user.id,
    review_decided_at: now,
    review_feedback: feedback ?? null,
    status: decision === "approved" ? "accepted" : "rejected",
    reviewed_by: user.id,
    reviewed_at: now,
  };
  if (decision === "revision_requested") {
    updatePayload.revision_count = (existing.revision_count ?? 0) + 1;
  }

  const { error: updateError } = await supabase
    .from("assets")
    .update(updatePayload)
    .eq("id", assetId);
  if (updateError) {
    return { success: false as const, error: updateError.message };
  }

  // Stamp the latest version row with this round's outcome. Best-effort so
  // the decision still lands even before the versions table is provisioned.
  try {
    const { data: latestVersion } = await supabase
      .from("asset_versions")
      .select("id")
      .eq("asset_id", assetId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestVersion?.id) {
      await supabase
        .from("asset_versions")
        .update({
          review_status:
            decision === "approved" ? "approved" : "revision_requested",
          review_feedback: feedback ?? null,
          review_decided_by: user.id,
          review_decided_at: now,
        })
        .eq("id", latestVersion.id);
    }
  } catch {
    /* versions table not present yet — non-fatal */
  }

  await supabase.from("audit_entries").insert({
    event_id: existing.event_id,
    actor_id: user.id,
    action: `asset_review_${decision}`,
    entity_type: "asset",
    entity_id: assetId,
    metadata: { feedback: feedback ?? null },
  });

  const { data: eventRow } = await supabase
    .from("events")
    .select("name")
    .eq("id", existing.event_id)
    .single();

  await dispatchNotification(
    decision === "approved"
      ? "asset.review_approved"
      : "asset.revision_requested",
    {
      eventId: existing.event_id,
      assetId,
      actorId: user.id,
      assetName: existing.name,
      eventName: eventRow?.name ?? "your event",
      feedback: feedback ?? "",
      entityType: "asset",
      entityId: assetId,
    }
  );

  // Pipedrive write-back — silently no-ops if the event isn't linked.
  await enqueueAssetReviewDecision(
    existing.event_id,
    existing.name,
    decision,
    feedback
  );

  revalidatePath(`/events/${existing.event_id}/assets`);
  revalidatePath("/admin/asset-reviews");
  revalidatePath(`/events/${existing.event_id}`);
  revalidatePath("/");
  return { success: true as const };
}
