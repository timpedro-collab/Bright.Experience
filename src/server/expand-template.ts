/**
 * Expand an event template into concrete milestones, tasks, assets, and QA items.
 *
 * Server-only internal, not a Server Action: it writes with the service role and
 * takes an arbitrary event id, so exporting it from a `"use server"` module made
 * it a public RPC endpoint anyone could POST to. Callers are responsible for
 * authorising first — today that is `createEvent` (internal-role gated) and
 * `provisionEventFromQuote`.
 */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  buildGameFlowAssetRows,
  GAME_FLOW_ASSET_SPECS,
} from "@/lib/asset-requirements/game-flow";
import type { Stage } from "@/types";

/** Spec applicability seeded by default on a standard game-flow event. */
const DEFAULT_APPLICABILITY = new Set(["always", "storefront"]);

/** First 8 hex chars of the event uuid — the deterministic id prefix. */
function eventIdPrefix(eventId: string): string {
  return eventId.replace(/-/g, "").slice(0, 8);
}

/** Creative due date: 21 days before the event, never in the past. */
function creativeDueDate(eventDateStart?: string | null): string {
  const base = eventDateStart ? new Date(eventDateStart) : new Date();
  const due = new Date(base.getTime() - 21 * 86_400_000);
  const floor = new Date(Date.now() + 7 * 86_400_000);
  return (due.getTime() < floor.getTime() ? floor : due)
    .toISOString()
    .slice(0, 10);
}

/** Maps a task's `target_path` to the stage whose milestone it should link to. */
const TARGET_PATH_TO_STAGE: Record<string, Stage> = {
  briefing: "kickoff_complete",
  assets: "creative_assets",
  studio: "creative_assets",
  approvals: "approvals",
  logistics: "logistics_confirmed",
  qa: "logistics_confirmed",
  reports: "reporting",
};

/**
 * Reads the template's JSON arrays and bulk-inserts rows into the
 * corresponding tables for the given event. After inserting milestones
 * and tasks, links each task to its stage-appropriate milestone via
 * `target_path` so blocking tasks only gate the relevant stage.
 */
export async function expandTemplate(
  eventId: string,
  templateId: string
): Promise<void> {
  const supabase = getServiceRoleClient();

  const { data: tmpl, error: tmplErr } = await supabase
    .from("event_templates")
    .select("milestones_json, tasks_json, assets_json, qa_items_json, compliance_json, game_config_defaults_json, product_config_defaults_json, venue_requirements_json")
    .eq("id", templateId)
    .single();

  if (tmplErr || !tmpl) {
    console.error("[expandTemplate] template not found", templateId, tmplErr);
    return;
  }

  const milestones = (tmpl.milestones_json ?? []) as Record<string, unknown>[];
  const tasks = (tmpl.tasks_json ?? []) as Record<string, unknown>[];
  const assets = (tmpl.assets_json ?? []) as Record<string, unknown>[];
  const qaItems = (tmpl.qa_items_json ?? []) as Record<string, unknown>[];

  if (milestones.length > 0) {
    const rows = milestones.map((m) => ({ ...m, event_id: eventId }));
    const { error } = await supabase.from("milestones").insert(rows);
    if (error) console.error("[expandTemplate] milestones insert failed", error);
  }

  if (tasks.length > 0) {
    const rows = tasks.map((t) => ({ ...t, event_id: eventId }));
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) console.error("[expandTemplate] tasks insert failed", error);
  }

  await linkTasksToMilestones(supabase, eventId, tasks);

  if (assets.length > 0) {
    const rows = assets.map((a) => ({ ...a, event_id: eventId }));
    const { error } = await supabase.from("assets").insert(rows);
    if (error) console.error("[expandTemplate] assets insert failed", error);
  } else {
    // No template-authored asset rows → single-source the requirements from
    // the canonical game-flow spec so specs never drift between SQL and code.
    const { data: ev } = await supabase
      .from("events")
      .select("event_date_start")
      .eq("id", eventId)
      .maybeSingle();

    const applicableKeys = new Set(
      GAME_FLOW_ASSET_SPECS.filter((s) =>
        DEFAULT_APPLICABILITY.has(s.appliesWhen),
      ).map((s) => s.key),
    );
    const rows = buildGameFlowAssetRows(
      eventId,
      eventIdPrefix(eventId),
      creativeDueDate(ev?.event_date_start),
    ).filter((row) => {
      const spec = GAME_FLOW_ASSET_SPECS.find((s) => s.name === row.name);
      return spec ? applicableKeys.has(spec.key) : true;
    });

    if (rows.length > 0) {
      const { error } = await supabase.from("assets").insert(rows);
      if (error)
        console.error("[expandTemplate] game-flow assets insert failed", error);
    }
  }

  if (qaItems.length > 0) {
    const rows = qaItems.map((q) => ({ ...q, event_id: eventId }));
    const { error } = await supabase.from("qa_items").insert(rows);
    if (error) console.error("[expandTemplate] qa_items insert failed", error);
  }

  const complianceDocs = (tmpl.compliance_json ?? []) as Record<string, unknown>[];
  if (complianceDocs.length > 0) {
    const rows = complianceDocs.map((c) => ({ ...c, event_id: eventId, status: "required" }));
    const { error } = await supabase.from("compliance_documents").insert(rows);
    if (error) console.error("[expandTemplate] compliance_documents insert failed", error);
  }

  const venueReqs = (tmpl.venue_requirements_json ?? []) as Record<string, unknown>[];
  if (venueReqs.length > 0) {
    const rows = venueReqs.map((v) => ({ ...v, event_id: eventId }));
    const { error } = await supabase.from("venue_requirements").insert(rows);
    if (error) console.error("[expandTemplate] venue_requirements insert failed", error);
  }

  if (tmpl.game_config_defaults_json) {
    const defaults = tmpl.game_config_defaults_json as Record<string, unknown>;
    const { error } = await supabase.from("game_configurations").insert({
      event_id: eventId,
      ...defaults,
      status: "draft",
    });
    if (error) console.error("[expandTemplate] game_configurations insert failed", error);
  }

  if (tmpl.product_config_defaults_json) {
    const defaults = tmpl.product_config_defaults_json as Record<string, unknown>;
    const { error } = await supabase.from("product_configurations").insert({
      event_id: eventId,
      ...defaults,
    });
    if (error) console.error("[expandTemplate] product_configurations insert failed", error);
  }
}

/**
 * After milestones and tasks are inserted, links each task to the
 * milestone matching its `target_path` stage. Tasks without a
 * recognised target_path keep `milestone_id = null` (global blockers).
 */
async function linkTasksToMilestones(
  supabase: ReturnType<typeof getServiceRoleClient>,
  eventId: string,
  templateTasks: Record<string, unknown>[]
): Promise<void> {
  const pathsInUse = [
    ...new Set(
      templateTasks
        .map((t) => t.target_path as string | undefined)
        .filter((p): p is string => !!p && p in TARGET_PATH_TO_STAGE)
    ),
  ];
  if (pathsInUse.length === 0) return;

  const stages = [...new Set(pathsInUse.map((p) => TARGET_PATH_TO_STAGE[p]))];

  const { data: eventMilestones } = await supabase
    .from("milestones")
    .select("id, stage")
    .eq("event_id", eventId)
    .in("stage", stages);

  if (!eventMilestones || eventMilestones.length === 0) return;

  const stageToMilestoneId: Record<string, string> = {};
  for (const m of eventMilestones) {
    stageToMilestoneId[m.stage as string] = m.id;
  }

  for (const targetPath of pathsInUse) {
    const stage = TARGET_PATH_TO_STAGE[targetPath];
    const milestoneId = stageToMilestoneId[stage];
    if (!milestoneId) continue;

    const { error } = await supabase
      .from("tasks")
      .update({ milestone_id: milestoneId })
      .eq("event_id", eventId)
      .eq("target_path", targetPath)
      .is("milestone_id", null);

    if (error) {
      console.error("[expandTemplate] task milestone link failed", targetPath, error);
    }
  }
}
