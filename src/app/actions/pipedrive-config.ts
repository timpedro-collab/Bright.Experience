"use server";

/**
 * Server actions backing `/admin/integrations/pipedrive`.
 *
 * Three actions:
 *   - `saveConfig`     — persist token / field keys / pipeline
 *   - `testConnection` — calls `/users/me` and reports result
 *   - `runDrain`       — manually drains the outbox right now
 *
 * Internal users only. The setup table itself has RLS on internal
 * role, but we re-check at the app layer so a misconfigured client
 * never silently writes.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { drainOutbox, type DrainResult } from "@/lib/pipedrive/drain";
import {
  getCurrentPipedriveUser,
  loadPipedriveConfig,
} from "@/lib/pipedrive/client";

const configSchema = z.object({
  apiToken: z.string().optional(),
  baseUrl: z.string().url().optional(),
  fieldKeyLastActivityAt: z.string().optional(),
  fieldKeyHealthStatus: z.string().optional(),
  fieldKeyDeliveredEvents: z.string().optional(),
  healthOptionGreenId: z.coerce.number().int().optional(),
  healthOptionAmberId: z.coerce.number().int().optional(),
  healthOptionRedId: z.coerce.number().int().optional(),
  defaultPipelineId: z.coerce.number().int().optional(),
});

async function ensureInternal(): Promise<{ ok: false; error: string } | { ok: true }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  if (!isAdminRole(user.role)) {
    return { ok: false, error: "Admin role required" };
  }
  return { ok: true };
}

export async function saveConfig(formData: FormData) {
  const gate = await ensureInternal();
  if (!gate.ok) return gate;

  const parsed = configSchema.safeParse({
    apiToken: (formData.get("apiToken") as string) || undefined,
    baseUrl: (formData.get("baseUrl") as string) || undefined,
    fieldKeyLastActivityAt:
      (formData.get("fieldKeyLastActivityAt") as string) || undefined,
    fieldKeyHealthStatus:
      (formData.get("fieldKeyHealthStatus") as string) || undefined,
    fieldKeyDeliveredEvents:
      (formData.get("fieldKeyDeliveredEvents") as string) || undefined,
    healthOptionGreenId:
      (formData.get("healthOptionGreenId") as string) || undefined,
    healthOptionAmberId:
      (formData.get("healthOptionAmberId") as string) || undefined,
    healthOptionRedId:
      (formData.get("healthOptionRedId") as string) || undefined,
    defaultPipelineId:
      (formData.get("defaultPipelineId") as string) || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = getServiceRoleClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.apiToken !== undefined) update.api_token = parsed.data.apiToken || null;
  if (parsed.data.baseUrl !== undefined) update.base_url = parsed.data.baseUrl;
  if (parsed.data.fieldKeyLastActivityAt !== undefined)
    update.field_key_last_activity_at = parsed.data.fieldKeyLastActivityAt || null;
  if (parsed.data.fieldKeyHealthStatus !== undefined)
    update.field_key_health_status = parsed.data.fieldKeyHealthStatus || null;
  if (parsed.data.fieldKeyDeliveredEvents !== undefined)
    update.field_key_delivered_events = parsed.data.fieldKeyDeliveredEvents || null;
  if (parsed.data.healthOptionGreenId !== undefined)
    update.health_option_green_id = parsed.data.healthOptionGreenId;
  if (parsed.data.healthOptionAmberId !== undefined)
    update.health_option_amber_id = parsed.data.healthOptionAmberId;
  if (parsed.data.healthOptionRedId !== undefined)
    update.health_option_red_id = parsed.data.healthOptionRedId;
  if (parsed.data.defaultPipelineId !== undefined)
    update.default_pipeline_id = parsed.data.defaultPipelineId;

  await supabase.from("pipedrive_config").update(update).eq("id", 1);
  revalidatePath("/admin/integrations/pipedrive");
  return { ok: true as const };
}

export async function testConnection(): Promise<
  { ok: true; name: string; email: string } | { ok: false; error: string }
> {
  const gate = await ensureInternal();
  if (!gate.ok) return gate;

  const config = await loadPipedriveConfig();
  if (!config) {
    return { ok: false, error: "No API token configured" };
  }
  const result = await getCurrentPipedriveUser(config);
  if (!result.ok) {
    return { ok: false, error: result.reason };
  }
  return {
    ok: true,
    name: result.data.name,
    email: result.data.email,
  };
}

export async function runDrain(): Promise<
  { ok: true; result: DrainResult } | { ok: false; error: string }
> {
  const gate = await ensureInternal();
  if (!gate.ok) return gate;
  const result = await drainOutbox({ limit: 50 });
  revalidatePath("/admin/integrations/pipedrive");
  return { ok: true, result };
}
