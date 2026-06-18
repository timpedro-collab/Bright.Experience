/** Server actions for event template management. */
"use server";

import { redirect } from "next/navigation";
import { requireInternalUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import type { ActionResult } from "@/types/actions";

/**
 * Guard: resolve the caller and require a commercial role
 * (events_lead / admin / developer) — templates are a commercial surface.
 */
async function requireCommercialUser() {
  const ctx = await requireInternalUser();
  if (!canViewCommercial(ctx.profile.role)) {
    throw new Error("Forbidden: commercial access only");
  }
  return ctx;
}

/**
 * Create a new event template from the admin form.
 * Milestones, tasks, assets, and QA items start empty — the admin edits them
 * after creation (or duplicates from a seed).
 */
export async function createTemplate(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireCommercialUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length < 2) {
    return { success: false, error: "Template name is required (min 2 chars)." };
  }

  const description = String(formData.get("description") ?? "").trim() || null;
  const eventType = String(formData.get("eventType") ?? "activation");
  const packageType = String(formData.get("packageType") ?? "standard");

  const { data, error } = await supabase
    .from("event_templates")
    .insert({
      name,
      description,
      event_type: eventType,
      package_type: packageType,
      milestones_json: [],
      tasks_json: [],
      assets_json: [],
      qa_items_json: [],
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createTemplate] insert failed", error);
    return { success: false, error: "Failed to create template." };
  }

  redirect("/admin/templates");
}

/** Save template JSON data (editor). */
export async function saveTemplateData(
  templateId: string,
  data: {
    milestones_json?: unknown[];
    tasks_json?: unknown[];
    assets_json?: unknown[];
    qa_items_json?: unknown[];
    compliance_json?: unknown[];
    venue_requirements_json?: unknown[];
    game_config_defaults_json?: Record<string, unknown> | null;
    product_config_defaults_json?: Record<string, unknown> | null;
  }
): Promise<ActionResult> {
  const { supabase } = await requireCommercialUser();

  const { error } = await supabase
    .from("event_templates")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", templateId);

  if (error) return { success: false, error: `Save failed: ${error.message}` };
  return { success: true, data: undefined };
}

/** Save a live event's current configuration as a new template. */
export async function saveEventAsTemplate(
  eventId: string,
  templateName: string
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireCommercialUser();

  const { data: event } = await supabase
    .from("events")
    .select("event_type, package_type")
    .eq("id", eventId)
    .single();
  if (!event) return { success: false, error: "Event not found" };

  const [
    { data: milestones },
    { data: tasks },
    { data: assets },
    { data: qaItems },
    { data: compDocs },
    { data: venueReqs },
    { data: gameConfig },
    { data: productConfig },
  ] = await Promise.all([
    supabase.from("milestones").select("name, stage, status, sort_order, target_date").eq("event_id", eventId),
    supabase.from("tasks").select("title, description, task_type, category, target_path, assigned_role, is_blocking, priority, sort_order").eq("event_id", eventId),
    supabase.from("assets").select("name, description, asset_type, required_format, required_dimensions, required_resolution_min, required_file_types, animation_requirements, safe_zone_description, is_physical, customer_visible").eq("event_id", eventId),
    supabase.from("qa_items").select("title, description, category, sort_order").eq("event_id", eventId),
    supabase.from("compliance_documents").select("document_type, title, required_minimum").eq("event_id", eventId),
    supabase.from("venue_requirements").select("requirement_type, description").eq("event_id", eventId),
    supabase.from("game_configurations").select("prize_mode, prizes_json, form_fields_json, game_parameters_json, idle_screen_config_json, include_score_in_export, leaderboard_enabled").eq("event_id", eventId).maybeSingle(),
    supabase.from("product_configurations").select("products_json, total_units").eq("event_id", eventId).maybeSingle(),
  ]);

  const { data: tmpl, error } = await supabase
    .from("event_templates")
    .insert({
      name: templateName,
      event_type: event.event_type,
      package_type: event.package_type,
      milestones_json: milestones ?? [],
      tasks_json: tasks ?? [],
      assets_json: assets ?? [],
      qa_items_json: qaItems ?? [],
      compliance_json: compDocs ?? [],
      venue_requirements_json: venueReqs ?? [],
      game_config_defaults_json: gameConfig ?? null,
      product_config_defaults_json: productConfig ?? null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !tmpl) return { success: false, error: "Failed to create template from event" };
  return { success: true, data: { id: tmpl.id } };
}
