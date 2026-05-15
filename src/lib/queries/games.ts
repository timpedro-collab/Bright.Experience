/** Supabase read queries for the games catalog entity. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all active games ordered by sort_order. */
export async function getGames() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, name, slug, thumbnail_url, category, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data) return [];
  return data;
}

/** Fetch a single game by slug with compatible machines via the junction table. */
export async function getGameBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select(
      `id, name, slug, description, thumbnail_url, preview_video_url,
       category, suitable_for, objectives, crowd_guidance,
       is_active, sort_order, created_at,
       machine_games ( machine_id, machines ( id, name, slug, tagline, hero_image_url ) )`
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
}
