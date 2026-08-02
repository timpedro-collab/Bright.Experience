/** Supabase read queries for the games catalog entity. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Fetch all active games ordered by sort_order. */
export async function getGames() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, name, slug, thumbnail_url, category, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    logQueryError("getGames", error);
    return [];
  }
  return data ?? [];
}

/**
 * The display name for a game id. Used where a configuration row stores the
 * id and the reader needs the title — nobody should be shown a UUID.
 */
export async function getGameNameById(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    logQueryError("getGameNameById", error, { id });
    return null;
  }
  return String((data as { name: string }).name);
}

/** Fetch a single active game by slug with compatible machines. */
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
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    logQueryError("getGameBySlug", error, { slug });
    return null;
  }
  return data;
}
