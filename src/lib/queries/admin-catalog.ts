/** Admin-scoped catalog queries — fetch all items regardless of active/published status. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all machines including inactive ones. */
export async function getAllMachines() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("id, name, slug, tagline, hero_image_url, is_active, sort_order, created_at")
    .order("sort_order");

  if (error) return [];
  return data ?? [];
}

/** Fetch all games including inactive ones. */
export async function getAllGames() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, name, slug, thumbnail_url, category, is_active, sort_order, created_at")
    .order("sort_order");

  if (error) return [];
  return data ?? [];
}

/** Fetch all packages including non-bookable ones, with parent machine name. */
export async function getAllPackages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("id, name, slug, tier, base_price, duration_days, is_bookable, machine_id, created_at, machines ( id, name )")
    .order("tier")
    .order("base_price");

  if (error) return [];
  return data ?? [];
}

/** Fetch all case studies including unpublished ones. */
export async function getAllCaseStudies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("id, title, slug, client_name, event_type, location, hero_image_url, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
