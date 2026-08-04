"use server";

/** Server actions for event-scoped real-time lead webhook subscriptions. */

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  createLeadWebhookSchema,
  type CreateLeadWebhookInput,
} from "@/lib/validations/lead-webhooks";
import type { ActionResult } from "@/types/actions";

export interface LeadWebhookListItem {
  id: string;
  url: string;
  isActive: boolean;
  failureCount: number;
  lastTriggeredAt: string | null;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function mapWebhook(row: Record<string, unknown>): LeadWebhookListItem {
  return {
    id: row.id as string,
    url: row.url as string,
    isActive: row.is_active as boolean,
    failureCount: (row.failure_count as number) ?? 0,
    lastTriggeredAt: (row.last_triggered_at as string | null) ?? null,
  };
}

/** Internal staff or the event's account customer may manage lead webhooks. */
async function authorizeEventAccess(
  eventId: string,
): Promise<ActionResult<{ supabase: SupabaseClient }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return { success: false, error: "You don't have access to this event." };
  }

  return { success: true, data: { supabase } };
}

async function authorizeWebhookSubscription(
  webhookId: string,
): Promise<ActionResult<{ eventId: string }>> {
  const admin = getServiceRoleClient();
  const { data: sub } = await admin
    .from("webhook_subscriptions")
    .select("event_id")
    .eq("id", webhookId)
    .maybeSingle();

  if (!sub?.event_id) {
    return { success: false, error: "Webhook not found." };
  }

  const auth = await authorizeEventAccess(String(sub.event_id));
  if (!auth.success) return auth;

  return { success: true, data: { eventId: String(sub.event_id) } };
}

/**
 * Register an HTTPS endpoint that receives each lead as it is captured.
 * Returns the signing secret once — it cannot be retrieved again.
 */
export async function createLeadWebhook(
  input: CreateLeadWebhookInput,
): Promise<ActionResult<{ id: string; secret: string }>> {
  const parsed = createLeadWebhookSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { eventId, url } = parsed.data;
  const auth = await authorizeEventAccess(eventId);
  if (!auth.success) return auth;

  // Service role after explicit event access: webhook_subscriptions RLS is
  // account-scoped, not event-scoped, so event rows are managed here.
  const admin = getServiceRoleClient();
  const { data: event } = await admin
    .from("events")
    .select("account_id")
    .eq("id", eventId)
    .maybeSingle();

  const secret = randomBytes(32).toString("hex");

  const { data: row, error } = await admin
    .from("webhook_subscriptions")
    .insert({
      event_id: eventId,
      account_id: event?.account_id ?? null,
      url,
      events: ["lead.captured"],
      secret,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !row) {
    return { success: false, error: "Failed to create webhook." };
  }

  revalidatePath(`/events/${eventId}/leads`);
  return { success: true, data: { id: row.id as string, secret } };
}

/** Enable or disable a lead webhook without deleting it. */
export async function toggleLeadWebhook(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const auth = await authorizeWebhookSubscription(id);
  if (!auth.success) return auth;

  const admin = getServiceRoleClient();
  const { error } = await admin
    .from("webhook_subscriptions")
    .update({ is_active: active })
    .eq("id", id);

  if (error) return { success: false, error: "Failed to update webhook." };

  revalidatePath(`/events/${auth.data.eventId}/leads`);
  return { success: true, data: undefined };
}

/** Remove a lead webhook subscription. */
export async function deleteLeadWebhook(id: string): Promise<ActionResult> {
  const auth = await authorizeWebhookSubscription(id);
  if (!auth.success) return auth;

  const admin = getServiceRoleClient();
  const { error } = await admin.from("webhook_subscriptions").delete().eq("id", id);

  if (error) return { success: false, error: "Failed to delete webhook." };

  revalidatePath(`/events/${auth.data.eventId}/leads`);
  return { success: true, data: undefined };
}

/** List lead webhooks for an event — never includes the signing secret. */
export async function getLeadWebhooksForEvent(
  eventId: string,
): Promise<ActionResult<LeadWebhookListItem[]>> {
  const auth = await authorizeEventAccess(eventId);
  if (!auth.success) return auth;

  const admin = getServiceRoleClient();
  const { data, error } = await admin
    .from("webhook_subscriptions")
    .select("id, url, is_active, failure_count, last_triggered_at, events")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Failed to load webhooks." };
  }

  const rows = (data ?? []).filter((row: Record<string, unknown>) => {
    const events = row.events;
    return Array.isArray(events) && events.includes("lead.captured");
  });

  return {
    success: true,
    data: rows.map((row: Record<string, unknown>) => mapWebhook(row)),
  };
}
