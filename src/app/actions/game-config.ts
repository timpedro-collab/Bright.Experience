"use server";

/**
 * Server actions for game and product configuration.
 * Replaces the email-based configuration workflow.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { autoCompleteTaskByPath } from "@/server/tasks";
import { parseCaptureRules, DEFAULT_RETENTION_DAYS, type CaptureRules } from "@/lib/capture-rules";
import { saveGameConfigurationSchema } from "@/lib/validations/game-config";
import {
  buildEventConfigPayload,
  type EventConfigInput,
} from "@/lib/brightblue/config-payload";
import { pushEventConfig } from "@/lib/brightblue/client";
import type { ActionResult } from "@/types/actions";
import type { MachineLane } from "@/lib/configuration/machine-config";
import type { FleetMachine } from "@/lib/configuration/resolve-config";
import type { MachineMission } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

// Re-exported for backwards compatibility — the machine build types + the
// SPIRAL_SIZES value now live in a plain module (a "use server" file may
// only export async functions). Import the SPIRAL_SIZES *value* directly
// from "@/lib/configuration/machine-config".
export type {
  MachineMechanism,
  MachineWidth,
  SpiralSize,
  MachineLane,
} from "@/lib/configuration/machine-config";

export type PrizeMode = "random" | "score_based" | "guaranteed";
export type GameConfigStatus = "draft" | "submitted" | "configured" | "tested";

/**
 * How a play is unlocked and identity established. `form` is the standard
 * entry form; `badge_scan` reads the attendee's event badge for verified
 * registration data at the cost of the extra context a form collects;
 * `both` lets the attendee choose. Enforced machine-side.
 */
export type CaptureMethod = "form" | "badge_scan" | "both";

export interface PrizeEntry {
  name: string;
  imageUrl?: string;
  quantity: number;
  probability?: number;
}

export interface FormFieldEntry {
  label: string;
  type: "text" | "email" | "tel" | "select" | "checkbox";
  required: boolean;
  options?: string[];
}

export interface GameConfiguration {
  id: string;
  eventId: string;
  /**
   * Null on the show-wide default row; set on a per-machine override. A show
   * running a fleet with different jobs per unit holds one default row plus
   * an override per diverging machine (see lib/configuration/resolve-config).
   */
  machineInstanceId: string | null;
  gameId: string | null;
  prizeMode: PrizeMode;
  prizesJson: PrizeEntry[];
  formFieldsJson: FormFieldEntry[];
  includeScoreInExport: boolean;
  leaderboardEnabled: boolean;
  gameParametersJson: Record<string, unknown>;
  idleScreenConfigJson: Record<string, unknown>;
  captureRulesJson: CaptureRules;
  retentionDays: number;
  brandedLanding: boolean;
  captureMethod: CaptureMethod;
  status: GameConfigStatus;
  submittedBy: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductConfiguration {
  id: string;
  eventId: string;
  /** Null on the show-wide default row; set on a per-machine override. */
  machineInstanceId: string | null;
  productsJson: { name: string; sku?: string; slot?: number; stockRatio?: number; imageUrl?: string }[];
  totalUnits: number | null;
  samplesReceivedAt: string | null;
  samplesTested: boolean;
  machineConfigJson: MachineLane[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapGameConfig(row: Record<string, unknown>): GameConfiguration {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    machineInstanceId: (row.machine_instance_id as string | null) ?? null,
    gameId: (row.game_id as string | null) ?? null,
    prizeMode: row.prize_mode as PrizeMode,
    prizesJson: (row.prizes_json as PrizeEntry[]) ?? [],
    formFieldsJson: (row.form_fields_json as FormFieldEntry[]) ?? [],
    includeScoreInExport: Boolean(row.include_score_in_export),
    leaderboardEnabled: Boolean(row.leaderboard_enabled),
    gameParametersJson: (row.game_parameters_json as Record<string, unknown>) ?? {},
    idleScreenConfigJson: (row.idle_screen_config_json as Record<string, unknown>) ?? {},
    // Rows written before the capture-quality feature hold `{}` — parse fills
    // the safe defaults so old events behave as fully guarded.
    captureRulesJson: parseCaptureRules(row.capture_rules_json),
    retentionDays: (row.retention_days as number | null) ?? DEFAULT_RETENTION_DAYS,
    brandedLanding: Boolean(row.branded_landing),
    captureMethod: (row.capture_method as CaptureMethod | null) ?? "form",
    status: row.status as GameConfigStatus,
    submittedBy: (row.submitted_by as string | null) ?? null,
    submittedAt: (row.submitted_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapProductConfig(row: Record<string, unknown>): ProductConfiguration {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    machineInstanceId: (row.machine_instance_id as string | null) ?? null,
    productsJson: (row.products_json as ProductConfiguration["productsJson"]) ?? [],
    totalUnits: (row.total_units as number | null) ?? null,
    samplesReceivedAt: (row.samples_received_at as string | null) ?? null,
    samplesTested: Boolean(row.samples_tested),
    machineConfigJson: (row.machine_config_json as MachineLane[]) ?? [],
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * The configuration for one scope of a show. Pass a machine id to read that
 * unit's override; omit it for the show-wide default. Note this returns the
 * row as stored — use `resolveConfigForMachine` when you need inheritance.
 */
export async function getGameConfiguration(
  eventId: string,
  machineInstanceId: string | null = null
): Promise<GameConfiguration | null> {
  const supabase = await createClient();
  const query = supabase.from("game_configurations").select("*").eq("event_id", eventId);
  const scoped = machineInstanceId
    ? query.eq("machine_instance_id", machineInstanceId)
    : query.is("machine_instance_id", null);
  const { data, error } = await scoped.maybeSingle();
  if (error || !data) {
    logQueryError("getGameConfiguration", error, { eventId });
    return null;
  }
  return mapGameConfig(data as Record<string, unknown>);
}

/** Every game configuration row on a show: the default plus any overrides. */
export async function getGameConfigurations(eventId: string): Promise<GameConfiguration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_configurations")
    .select("*")
    .eq("event_id", eventId);
  if (error || !data) {
    logQueryError("getGameConfigurations", error, { eventId });
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapGameConfig);
}

/**
 * Every product configuration row on a show: the default plus any overrides.
 *
 * The per-scope getter answers "what does this unit load?" one unit at a time,
 * which costs a round trip per machine on any page that reads a whole fleet.
 * Callers resolve scope themselves with `resolveConfigForMachine`.
 */
export async function getProductConfigurations(
  eventId: string
): Promise<ProductConfiguration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_configurations")
    .select("*")
    .eq("event_id", eventId);
  if (error || !data) {
    logQueryError("getProductConfigurations", error, { eventId });
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapProductConfig);
}

export async function getProductConfiguration(
  eventId: string,
  machineInstanceId: string | null = null
): Promise<ProductConfiguration | null> {
  const supabase = await createClient();
  const query = supabase.from("product_configurations").select("*").eq("event_id", eventId);
  const scoped = machineInstanceId
    ? query.eq("machine_instance_id", machineInstanceId)
    : query.is("machine_instance_id", null);
  const { data, error } = await scoped.maybeSingle();
  if (error || !data) {
    logQueryError("getProductConfiguration", error, { eventId });
    return null;
  }
  return mapProductConfig(data as Record<string, unknown>);
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Write a configuration row for one scope of a show.
 *
 * Uniqueness is enforced by an expression index over
 * `coalesce(machine_instance_id, <sentinel>)` (NULLs are distinct in a plain
 * unique constraint, so the show-wide default would otherwise duplicate).
 * PostgREST cannot target an expression index with `on_conflict`, so this
 * reads the scope first and then updates or inserts.
 */
async function writeScopedConfig(
  supabase: SupabaseClient,
  table: "game_configurations" | "product_configurations",
  eventId: string,
  machineInstanceId: string | null,
  values: Record<string, unknown>
): Promise<{ error: string | null }> {
  const lookup = supabase.from(table).select("id").eq("event_id", eventId);
  const scoped = machineInstanceId
    ? lookup.eq("machine_instance_id", machineInstanceId)
    : lookup.is("machine_instance_id", null);
  const { data: existing } = await scoped.maybeSingle();

  const { error } = existing
    ? await supabase.from(table).update(values).eq("id", existing.id)
    : await supabase.from(table).insert({
        ...values,
        event_id: eventId,
        machine_instance_id: machineInstanceId,
      });

  return { error: error ? error.message : null };
}

/**
 * Assemble the outbound machine payload for a show: the show-wide default,
 * every per-machine override, and the fleet those overrides resolve against.
 *
 * `justSaved` stands in for the default when a show has only ever had a
 * per-machine row written (nothing to inherit from otherwise).
 */
async function assembleConfigPayload(
  supabase: SupabaseClient,
  eventId: string,
  justSaved: EventConfigInput
) {
  const [{ data: configRows }, { data: machineRows }] = await Promise.all([
    supabase.from("game_configurations").select("*").eq("event_id", eventId),
    supabase
      .from("machine_instances")
      .select("id, serial_number, nickname, zone, mission")
      .eq("current_event_id", eventId)
      .order("serial_number", { ascending: true }),
  ]);

  const scoped = ((configRows as Record<string, unknown>[] | null) ?? []).map(mapGameConfig);
  const toInput = (c: GameConfiguration): EventConfigInput => ({
    prizeMode: c.prizeMode,
    prizesJson: c.prizesJson,
    formFieldsJson: c.formFieldsJson,
    leaderboardEnabled: c.leaderboardEnabled,
    gameParametersJson: c.gameParametersJson,
    idleScreenConfigJson: c.idleScreenConfigJson,
    captureRulesJson: c.captureRulesJson,
    retentionDays: c.retentionDays,
    brandedLanding: c.brandedLanding,
    captureMethod: c.captureMethod,
    machineInstanceId: c.machineInstanceId,
  });

  const showDefault = scoped.find((c) => c.machineInstanceId === null);
  const overrides = scoped.filter((c) => c.machineInstanceId !== null).map(toInput);
  const fleet: FleetMachine[] = (
    (machineRows as Record<string, unknown>[] | null) ?? []
  ).map((m) => ({
    id: m.id as string,
    serialNumber: m.serial_number as string,
    nickname: (m.nickname as string | undefined) ?? undefined,
    zone: (m.zone as string | null) ?? null,
    mission: (m.mission as MachineMission | null) ?? null,
  }));

  return buildEventConfigPayload(
    eventId,
    showDefault ? toInput(showDefault) : justSaved,
    fleet,
    overrides
  );
}

export async function saveGameConfiguration(
  eventId: string,
  config: {
    prizeMode: PrizeMode;
    prizesJson: PrizeEntry[];
    formFieldsJson: FormFieldEntry[];
    includeScoreInExport: boolean;
    leaderboardEnabled: boolean;
    gameParametersJson: Record<string, unknown>;
    idleScreenConfigJson: Record<string, unknown>;
    captureRulesJson: CaptureRules;
    retentionDays: number;
    brandedLanding: boolean;
    captureMethod?: CaptureMethod;
    /** Omit (or null) to write the show-wide default; set to override one unit. */
    machineInstanceId?: string | null;
  },
  submit: boolean = false
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // QA verifies the configuration; it does not author it.
  const profile = await getUser();
  if (profile && profile.role === "qa_lead") {
    return {
      success: false,
      error: "QA can verify the configuration but not edit it.",
    };
  }

  const parsed = saveGameConfigurationSchema.safeParse({ eventId, ...config });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid configuration",
    };
  }

  const now = new Date().toISOString();
  const machineInstanceId = config.machineInstanceId ?? null;
  const values: Record<string, unknown> = {
    prize_mode: config.prizeMode,
    prizes_json: config.prizesJson,
    form_fields_json: config.formFieldsJson,
    include_score_in_export: config.includeScoreInExport,
    leaderboard_enabled: config.leaderboardEnabled,
    game_parameters_json: config.gameParametersJson,
    idle_screen_config_json: config.idleScreenConfigJson,
    capture_rules_json: config.captureRulesJson,
    retention_days: config.retentionDays,
    branded_landing: config.brandedLanding,
    capture_method: config.captureMethod ?? "form",
    updated_at: now,
  };

  if (submit) {
    values.status = "submitted";
    values.submitted_by = user.id;
    values.submitted_at = now;
  }

  const { error } = await writeScopedConfig(
    supabase,
    "game_configurations",
    eventId,
    machineInstanceId,
    values
  );

  if (error) {
    logQueryError("saveGameConfiguration", error);
    return { success: false, error: `Save failed: ${error}` };
  }

  // Submitting (not just saving a draft) is what fulfils the customer's
  // "Confirm prize details and quantities" task, so close it out here rather
  // than letting anyone tick it off without entering the details.
  if (submit) {
    await autoCompleteTaskByPath(eventId, "configuration");

    // Fire-and-forget: sync the submitted config (game + capture-quality
    // rules) to the machine stack. A Cloud outage must never block the
    // customer's submit — failures are logged and re-pushed on next submit.
    const payload = await assembleConfigPayload(supabase, eventId, config);
    void pushEventConfig(payload).catch((err) => {
      console.error(`[game-config] config push failed for ${eventId}`, err);
    });
  }

  revalidatePath(`/events/${eventId}/configuration`);
  return { success: true, data: undefined };
}

export async function saveProductConfiguration(
  eventId: string,
  config: {
    productsJson: ProductConfiguration["productsJson"];
    totalUnits?: number;
    notes?: string;
    /** Omit (or null) to write the show-wide default; set to override one unit. */
    machineInstanceId?: string | null;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // QA verifies the configuration; it does not author it. Mirrors
  // saveGameConfiguration so QA/Ops can't author the customer's product mix.
  const profile = await getUser();
  if (profile && profile.role === "qa_lead") {
    return {
      success: false,
      error: "QA can verify the configuration but not edit it.",
    };
  }

  const { error } = await writeScopedConfig(
    supabase,
    "product_configurations",
    eventId,
    config.machineInstanceId ?? null,
    {
      products_json: config.productsJson,
      total_units: config.totalUnits ?? null,
      notes: config.notes ?? null,
      updated_at: new Date().toISOString(),
    }
  );

  if (error) {
    logQueryError("saveProductConfiguration", error, { eventId });
    return { success: false, error: `Save failed: ${error}` };
  }

  // Product configuration has no separate "submit" step — providing at least
  // one product is the customer supplying their prize/sampling details, so
  // that fulfils the "Confirm prize details and quantities" task.
  if (config.productsJson.length > 0) {
    await autoCompleteTaskByPath(eventId, "configuration");
  }

  revalidatePath(`/events/${eventId}/configuration`);
  return { success: true, data: undefined };
}

/**
 * Save the physical machine build (lanes) + sample handling for an event.
 *
 * Operations authors this; QA verifies but does not edit (mirrors the game
 * configuration rule). Merges onto the existing product_configurations row so
 * the customer's product mix and notes are untouched.
 */
export async function saveMachineConfiguration(
  eventId: string,
  config: {
    machineConfigJson: MachineLane[];
    samplesReceivedAt?: string | null;
    samplesTested?: boolean;
    /** Omit (or null) to write the show-wide default; set to build one unit. */
    machineInstanceId?: string | null;
  }
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!isInternalRole(user.role)) {
    return { success: false, error: "Only the Bright.Blue team configures the machine." };
  }
  if (user.role === "qa_lead") {
    return { success: false, error: "QA can verify the machine build but not edit it." };
  }

  const supabase = await createClient();
  const values: Record<string, unknown> = {
    machine_config_json: config.machineConfigJson,
    updated_at: new Date().toISOString(),
  };
  if (config.samplesReceivedAt !== undefined) {
    values.samples_received_at = config.samplesReceivedAt;
  }
  if (config.samplesTested !== undefined) {
    values.samples_tested = config.samplesTested;
  }

  const { error } = await writeScopedConfig(
    supabase,
    "product_configurations",
    eventId,
    config.machineInstanceId ?? null,
    values
  );

  if (error) {
    logQueryError("saveMachineConfiguration", error, { eventId });
    return { success: false, error: `Save failed: ${error}` };
  }

  revalidatePath(`/events/${eventId}/machine`);
  revalidatePath(`/events/${eventId}/configuration`);
  return { success: true, data: undefined };
}

export async function updateGameConfigStatus(
  eventId: string,
  status: GameConfigStatus
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (!isInternalRole(user.role)) {
    return { success: false, error: "Only internal staff can change configuration status." };
  }
  const supabase = await createClient();
  // Status is a show-level verdict (QA signs off the whole configuration), so
  // this deliberately covers the default row and every per-machine override.
  const { error } = await supabase
    .from("game_configurations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("event_id", eventId);
  if (error) {
    logQueryError("updateGameConfigStatus", error, { eventId });
    return { success: false, error: `Update failed: ${error.message}` };
  }
  revalidatePath(`/events/${eventId}/configuration`);
  return { success: true, data: undefined };
}
