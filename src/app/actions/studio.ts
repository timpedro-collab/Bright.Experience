"use server";

/**
 * Server actions for Bright.Studio creative requests.
 *
 * Mutations for creating, updating, and cancelling studio orders. Each
 * action validates auth, persists the change, emits an audit entry, and
 * dispatches in-app + email notifications where appropriate.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendStudioOrderNotification } from "@/lib/email";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { canReviewCreativeAssets, canOrderStudioWork } from "@/lib/roles";
import { studioRequestSchema } from "@/lib/validations/studio";
import type { StudioServiceType, UserRole } from "@/types";
import type { ActionResult } from "@/types/actions";

/** Submit a new studio request for an event. */
export async function createStudioRequest(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Only roles permitted to order studio work may raise a request.
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const actorRole = actorProfile?.role as UserRole | undefined;
  if (!actorRole || !canOrderStudioWork(actorRole)) {
    return {
      success: false,
      error: "Your role can't order Bright.Studio work.",
    };
  }

  const eventId = formData.get("eventId") as string;
  const serviceType = formData.get("serviceType") as StudioServiceType;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!eventId || !serviceType || !title) {
    return { success: false, error: "Missing required fields" };
  }

  const parsed = studioRequestSchema.safeParse({
    serviceType,
    title,
    description,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const { data, error } = await supabase
    .from("studio_requests")
    .insert({
      event_id: eventId,
      service_type: serviceType,
      title,
      description: description || null,
      status: "submitted",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: `Failed to create request: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "studio_request_created",
    entity_type: "studio_request",
    entity_id: data.id,
    metadata: { service_type: serviceType, title },
  });

  const { data: event } = await supabase
    .from("events")
    .select("name, accounts(name)")
    .eq("id", eventId)
    .single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const account = event?.accounts as unknown as Record<string, unknown> | null;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  sendStudioOrderNotification({
    title,
    description: description || undefined,
    eventName: (event?.name as string) ?? "Unknown Event",
    accountName: (account?.name as string) ?? "Unknown Account",
    orderedBy: profile?.name ?? user.email ?? "Unknown",
    serviceType: serviceType === "design" ? "Static Visuals" : "Motion Visuals",
    portalUrl: `${baseUrl}/studio`,
  });

  await dispatchNotification("studio.request_submitted", {
    eventId,
    studioRequestId: data.id,
    actorId: user.id,
    title,
    serviceType:
      serviceType === "design" ? "Static visuals" : "Motion visuals",
    entityType: "studio_request",
    entityId: data.id,
  });

  revalidatePath(`/events/${eventId}/studio`);
  revalidatePath("/studio");
  return { success: true, data: { id: data.id } };
}

/**
 * "Fix it for me" — turn a struggling asset into a Bright.Studio order.
 * Pre-fills the brief from the asset's spec so the customer (or reviewer)
 * can hand a rejected/awkward slot straight to the creative team.
 */
export async function requestStudioFixForAsset(
  assetId: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Handing an asset to Bright.Studio is a creative-review action — same
  // ownership as approving/requesting a revision.
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const actorRole = actorProfile?.role as UserRole | undefined;
  if (!actorRole || !canReviewCreativeAssets(actorRole)) {
    return {
      success: false,
      error: "Only the Creative team can hand an asset to Bright.Studio.",
    };
  }

  const { data: asset } = await supabase
    .from("assets")
    .select("event_id, name, asset_type, required_format, required_dimensions, review_feedback")
    .eq("id", assetId)
    .single();
  if (!asset) return { success: false, error: "Asset not found" };

  const eventId = String(asset.event_id);
  const serviceType: StudioServiceType =
    asset.asset_type === "video" ? "video" : "design";

  const briefLines = [
    `Customer has asked Bright.Studio to produce the "${asset.name}" asset.`,
    asset.required_format ? `Required format: ${asset.required_format}` : null,
    asset.required_dimensions ? `Dimensions: ${asset.required_dimensions}` : null,
    asset.review_feedback ? `Latest reviewer note: ${asset.review_feedback}` : null,
  ].filter(Boolean);

  const { data, error } = await supabase
    .from("studio_requests")
    .insert({
      event_id: eventId,
      service_type: serviceType,
      title: `Studio build — ${asset.name}`,
      description: briefLines.join("\n"),
      status: "submitted",
      created_by: user.id,
      source_asset_id: assetId,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: `Could not create the order: ${error.message}` };
  }

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "studio_request_created",
    entity_type: "studio_request",
    entity_id: data.id,
    metadata: { service_type: serviceType, source_asset_id: assetId },
  });

  await dispatchNotification("studio.request_submitted", {
    eventId,
    studioRequestId: String(data.id),
    actorId: user.id,
    title: `Studio build — ${asset.name}`,
    serviceType: serviceType === "design" ? "Static visuals" : "Motion visuals",
    entityType: "studio_request",
    entityId: String(data.id),
  });

  revalidatePath(`/events/${eventId}/assets`);
  revalidatePath(`/events/${eventId}/studio`);
  revalidatePath("/studio");
  return { success: true, data: { id: String(data.id) } };
}

/** Optional details captured alongside a status transition. */
export interface StudioStatusOptions {
  note?: string;
  /** Quoted price in whole dollars from the form — stored as integer cents. */
  quotedCost?: number;
  /** Quoted turnaround in working days — captured when sending a quote. */
  quotedDays?: number;
}

/** Transition a studio request through its lifecycle. */
export async function updateStudioRequestStatus(
  requestId: string,
  eventId: string,
  status:
    | "quoted"
    | "approved"
    | "confirmed"
    | "in_progress"
    | "delivered"
    | "cancelled",
  options?: StudioStatusOptions
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Managing a studio order's lifecycle is a creative-team action.
  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const actorRole = actorProfile?.role as UserRole | undefined;
  if (!actorRole || !canReviewCreativeAssets(actorRole)) {
    return {
      success: false,
      error: "Only the Creative team can manage Bright.Studio orders.",
    };
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  }
  // Sending a quote must capture the figure the customer sees, otherwise the
  // request flips to "Quoted" with no price attached.
  if (status === "quoted") {
    if (typeof options?.quotedCost === "number" && options.quotedCost > 0) {
      updateData.quoted_cost = Math.round(options.quotedCost * 100);
    }
    if (typeof options?.quotedDays === "number" && options.quotedDays > 0) {
      updateData.quoted_days = options.quotedDays;
    }
  }
  if (status === "approved") {
    updateData.approved_by = user.id;
    updateData.approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("studio_requests")
    .update(updateData)
    .eq("id", requestId);

  if (error) return { success: false, error: `Failed to update: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: `studio_request_${status}`,
    entity_type: "studio_request",
    entity_id: requestId,
    metadata: {
      note: options?.note,
      quoted_cost: options?.quotedCost,
      quoted_days: options?.quotedDays,
    },
  });

  const { data: request } = await supabase
    .from("studio_requests")
    .select("title")
    .eq("id", requestId)
    .single();

  await dispatchNotification("studio.status_changed", {
    eventId,
    studioRequestId: requestId,
    actorId: user.id,
    title: request?.title ?? "Studio order",
    status,
    entityType: "studio_request",
    entityId: requestId,
  });

  revalidatePath(`/events/${eventId}/studio`);
  revalidatePath("/studio");
  return { success: true, data: undefined };
}
