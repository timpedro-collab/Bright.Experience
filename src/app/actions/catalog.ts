/** Server actions for catalog machines & games. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

/**
 * Resolve the acting user and confirm they own the creative/product catalog
 * (creative_lead, events_lead, admin, developer). Catalog mutations are not a
 * general internal-staff capability — Ops/QA must not edit or delete catalog.
 */
async function requireCatalogEditor() {
  const { supabase, profile } = await requireInternalUser();
  if (!canViewCreativeProduct(profile.role)) {
    return { ok: false as const, error: "Forbidden: creative access only" };
  }
  return { ok: true as const, supabase };
}

/** Insert a new machine into the catalog. */
export async function createMachine(data: {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  heroImageUrl?: string;
  videoUrl?: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { data: machine, error } = await supabase
    .from("machines")
    .insert({
      name: data.name,
      slug: data.slug,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      hero_image_url: data.heroImageUrl ?? null,
      video_url: data.videoUrl ?? null,
    })
    .select("id")
    .single();

  if (error || !machine) {
    return { success: false, error: "Could not create machine. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: machine.id as string } };
}

/** Update an existing machine. */
export async function updateMachine(
  id: string,
  data: Partial<{
    name: string;
    tagline: string;
    description: string;
    heroImageUrl: string;
    videoUrl: string;
    isActive: boolean;
  }>,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.tagline !== undefined) updates.tagline = data.tagline;
  if (data.description !== undefined) updates.description = data.description;
  if (data.heroImageUrl !== undefined) updates.hero_image_url = data.heroImageUrl;
  if (data.videoUrl !== undefined) updates.video_url = data.videoUrl;
  if (data.isActive !== undefined) updates.is_active = data.isActive;

  const { data: machine, error } = await supabase
    .from("machines")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !machine) {
    return { success: false, error: "Could not update machine. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: machine.id as string } };
}

/** Insert a new game into the catalog. */
export async function createGame(data: {
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  category?: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      thumbnail_url: data.thumbnailUrl ?? null,
      preview_video_url: data.previewVideoUrl ?? null,
      category: data.category ?? null,
    })
    .select("id")
    .single();

  if (error || !game) {
    return { success: false, error: "Could not create game. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: game.id as string } };
}

/** Update an existing game by ID. */
export async function updateGame(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    thumbnailUrl: string;
    previewVideoUrl: string;
    category: string;
    isActive: boolean;
  }>,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.thumbnailUrl !== undefined) updates.thumbnail_url = data.thumbnailUrl;
  if (data.previewVideoUrl !== undefined) updates.preview_video_url = data.previewVideoUrl;
  if (data.category !== undefined) updates.category = data.category;
  if (data.isActive !== undefined) updates.is_active = data.isActive;

  const { data: game, error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !game) {
    return { success: false, error: "Could not update game. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: game.id as string } };
}

/** Link a game to a machine via the junction table. */
export async function linkGameToMachine(
  machineId: string,
  gameId: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { data: row, error } = await supabase
    .from("machine_games")
    .insert({ machine_id: machineId, game_id: gameId })
    .select("id")
    .single();

  if (error || !row) {
    return { success: false, error: "Could not link game to machine. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: row.id as string } };
}

/** Delete a machine from the catalog. */
export async function deleteCatalogMachine(
  id: string,
): Promise<ActionResult> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("machines").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete machine. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: undefined };
}

/** Delete a game from the catalog. */
export async function deleteCatalogGame(id: string): Promise<ActionResult> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete game. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: undefined };
}
