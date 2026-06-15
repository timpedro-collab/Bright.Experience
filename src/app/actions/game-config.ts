"use server";

/**
 * Server actions for game and product configuration.
 * Replaces the email-based configuration workflow.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import type { ActionResult } from "@/types/actions";

export type PrizeMode = "random" | "score_based" | "guaranteed";
export type GameConfigStatus = "draft" | "submitted" | "configured" | "tested";

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
  gameId: string | null;
  prizeMode: PrizeMode;
  prizesJson: PrizeEntry[];
  formFieldsJson: FormFieldEntry[];
  includeScoreInExport: boolean;
  leaderboardEnabled: boolean;
  gameParametersJson: Record<string, unknown>;
  idleScreenConfigJson: Record<string, unknown>;
  status: GameConfigStatus;
  submittedBy: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductConfiguration {
  id: string;
  eventId: string;
  productsJson: { name: string; sku?: string; slot?: number; stockRatio?: number; preparationNotes?: string; imageUrl?: string }[];
  totalUnits: number | null;
  samplesReceivedAt: string | null;
  samplesTested: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapGameConfig(row: Record<string, unknown>): GameConfiguration {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    gameId: (row.game_id as string | null) ?? null,
    prizeMode: row.prize_mode as PrizeMode,
    prizesJson: (row.prizes_json as PrizeEntry[]) ?? [],
    formFieldsJson: (row.form_fields_json as FormFieldEntry[]) ?? [],
    includeScoreInExport: Boolean(row.include_score_in_export),
    leaderboardEnabled: Boolean(row.leaderboard_enabled),
    gameParametersJson: (row.game_parameters_json as Record<string, unknown>) ?? {},
    idleScreenConfigJson: (row.idle_screen_config_json as Record<string, unknown>) ?? {},
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
    productsJson: (row.products_json as ProductConfiguration["productsJson"]) ?? [],
    totalUnits: (row.total_units as number | null) ?? null,
    samplesReceivedAt: (row.samples_received_at as string | null) ?? null,
    samplesTested: Boolean(row.samples_tested),
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getGameConfiguration(eventId: string): Promise<GameConfiguration | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_configurations")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return mapGameConfig(data as Record<string, unknown>);
}

export async function getProductConfiguration(eventId: string): Promise<ProductConfiguration | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_configurations")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProductConfig(data as Record<string, unknown>);
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
  },
  submit: boolean = false
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const now = new Date().toISOString();
  const upsertData: Record<string, unknown> = {
    event_id: eventId,
    prize_mode: config.prizeMode,
    prizes_json: config.prizesJson,
    form_fields_json: config.formFieldsJson,
    include_score_in_export: config.includeScoreInExport,
    leaderboard_enabled: config.leaderboardEnabled,
    game_parameters_json: config.gameParametersJson,
    idle_screen_config_json: config.idleScreenConfigJson,
    updated_at: now,
  };

  if (submit) {
    upsertData.status = "submitted";
    upsertData.submitted_by = user.id;
    upsertData.submitted_at = now;
  }

  const { error } = await supabase
    .from("game_configurations")
    .upsert(upsertData, { onConflict: "event_id" });

  if (error) return { success: false, error: `Save failed: ${error.message}` };
  revalidatePath(`/events/${eventId}/configuration`);
  return { success: true, data: undefined };
}

export async function saveProductConfiguration(
  eventId: string,
  config: {
    productsJson: ProductConfiguration["productsJson"];
    totalUnits?: number;
    notes?: string;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("product_configurations")
    .upsert({
      event_id: eventId,
      products_json: config.productsJson,
      total_units: config.totalUnits ?? null,
      notes: config.notes ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "event_id" });

  if (error) return { success: false, error: `Save failed: ${error.message}` };
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
  const { error } = await supabase
    .from("game_configurations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("event_id", eventId);
  if (error) return { success: false, error: `Update failed: ${error.message}` };
  revalidatePath(`/events/${eventId}/configuration`);
  return { success: true, data: undefined };
}
