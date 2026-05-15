"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendStudioOrderNotification } from "@/lib/email";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import type { StudioServiceType } from "@/types";

export async function createStudioRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const eventId = formData.get("eventId") as string;
  const serviceType = formData.get("serviceType") as StudioServiceType;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!eventId || !serviceType || !title) {
    throw new Error("Missing required fields");
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

  if (error) throw new Error(`Failed to create request: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "studio_request_created",
    entity_type: "studio_request",
    entity_id: data.id,
    metadata: { service_type: serviceType, title },
  });

  // Fetch context for the email notification
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";

  sendStudioOrderNotification({
    title,
    description: description || undefined,
    eventName: (event?.name as string) ?? "Unknown Event",
    accountName: (account?.name as string) ?? "Unknown Account",
    orderedBy: profile?.name ?? user.email ?? "Unknown",
    serviceType: serviceType === "design" ? "Static Visuals" : "Motion Visuals",
    portalUrl: `${baseUrl}/studio`,
  });

  // In-portal notification for creative leads — keeps the queue badge fresh
  // even when Resend is not configured locally.
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
}

export async function updateStudioRequestStatus(
  requestId: string,
  eventId: string,
  status: "confirmed" | "in_progress" | "delivered" | "cancelled",
  note?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = { status };
  if (status === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("studio_requests")
    .update(updateData)
    .eq("id", requestId);

  if (error) throw new Error(`Failed to update: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: `studio_request_${status}`,
    entity_type: "studio_request",
    entity_id: requestId,
    metadata: { note },
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
}

export async function cancelStudioRequest(requestId: string, eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("studio_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) throw new Error(`Failed to cancel: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "studio_request_cancelled",
    entity_type: "studio_request",
    entity_id: requestId,
  });

  revalidatePath(`/events/${eventId}/studio`);
}
