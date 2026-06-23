/** Supabase read queries for the machines catalog entity. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all active machines ordered by sort_order. */
export async function getMachines() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("id, name, slug, tagline, hero_image_url, capacity_label, mechanisms, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[getMachines] query failed", error);
    return [];
  }
  return data ?? [];
}

/** Fetch a single active machine by slug with its games and bookable packages. */
export async function getMachineBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select(
      `id, name, slug, tagline, description, hero_image_url, gallery_urls, video_url,
       capacity_label, mechanisms, dispenses, features, best_for,
       is_active, sort_order, created_at,
       machine_games ( game_id, games ( id, name, slug, thumbnail_url, category, is_active ) ),
       packages ( id, name, slug, tier, base_price, duration_days, is_bookable )`
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[getMachineBySlug] query failed", { slug, error });
    return null;
  }
  return data;
}
