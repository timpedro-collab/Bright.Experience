/** Server actions for managing the game catalog (machines, games, packages, case studies). */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verify the current user is authenticated; throws if not. */
async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// Machines
// ---------------------------------------------------------------------------

/** Insert a new machine into the catalog. */
export async function createMachine(data: {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  heroImageUrl?: string;
  videoUrl?: string;
}) {
  const { supabase } = await requireAuth();

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
    .select()
    .single();

  if (error) throw new Error(`Failed to create machine: ${error.message}`);

  revalidatePath("/catalog");
  return machine;
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
  }>
) {
  const { supabase } = await requireAuth();

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
    .select()
    .single();

  if (error) throw new Error(`Failed to update machine: ${error.message}`);

  revalidatePath("/catalog");
  return machine;
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

/** Insert a new game into the catalog. */
export async function createGame(data: {
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  category?: string;
}) {
  const { supabase } = await requireAuth();

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
    .select()
    .single();

  if (error) throw new Error(`Failed to create game: ${error.message}`);

  revalidatePath("/catalog");
  return game;
}

/** Link a game to a machine via the junction table. */
export async function linkGameToMachine(machineId: string, gameId: string) {
  const { supabase } = await requireAuth();

  const { data: row, error } = await supabase
    .from("machine_games")
    .insert({ machine_id: machineId, game_id: gameId })
    .select()
    .single();

  if (error) throw new Error(`Failed to link game to machine: ${error.message}`);

  revalidatePath("/catalog");
  return row;
}

// ---------------------------------------------------------------------------
// Packages
// ---------------------------------------------------------------------------

/** Insert a new package into the catalog. */
export async function createPackage(data: {
  name: string;
  slug: string;
  machineId?: string;
  tier: string;
  basePrice?: number;
  durationDays?: number;
  featuresJson?: Record<string, unknown>;
  isBookable?: boolean;
}) {
  const { supabase } = await requireAuth();

  const { data: pkg, error } = await supabase
    .from("packages")
    .insert({
      name: data.name,
      slug: data.slug,
      machine_id: data.machineId ?? null,
      tier: data.tier,
      base_price: data.basePrice ?? null,
      duration_days: data.durationDays ?? null,
      features_json: data.featuresJson ?? null,
      is_bookable: data.isBookable ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create package: ${error.message}`);

  revalidatePath("/catalog");
  return pkg;
}

// ---------------------------------------------------------------------------
// Case Studies
// ---------------------------------------------------------------------------

/** Insert a new case study (created as unpublished by default). */
export async function createCaseStudy(data: {
  title: string;
  slug: string;
  clientName?: string;
  eventType?: string;
  location?: string;
  description?: string;
  heroImageUrl?: string;
}) {
  const { supabase } = await requireAuth();

  const { data: study, error } = await supabase
    .from("case_studies")
    .insert({
      title: data.title,
      slug: data.slug,
      client_name: data.clientName ?? null,
      event_type: data.eventType ?? null,
      location: data.location ?? null,
      description: data.description ?? null,
      hero_image_url: data.heroImageUrl ?? null,
      is_published: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create case study: ${error.message}`);

  revalidatePath("/catalog");
  return study;
}

/** Publish a case study by setting is_published and published_at. */
export async function publishCaseStudy(id: string) {
  const { supabase } = await requireAuth();

  const { data: study, error } = await supabase
    .from("case_studies")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to publish case study: ${error.message}`);

  revalidatePath("/catalog");
  return study;
}
