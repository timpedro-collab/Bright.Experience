/** Supabase read queries for the packages catalog entity. */
import { createClient } from "@/lib/supabase/server";

/** Fetch all bookable packages, including the parent machine name. */
export async function getPackages() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select(
      `id, name, slug, tier, base_price, duration_days, features_json, is_bookable,
       machines ( id, name )`
    )
    .eq("is_bookable", true)
    .order("tier")
    .order("base_price");

  if (error) {
    console.error("[getPackages] query failed", error);
    return [];
  }
  return data ?? [];
}

/** Fetch bookable packages scoped to a specific machine. */
export async function getPackagesByMachine(machineId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("id, name, slug, tier, base_price, duration_days, features_json, is_bookable")
    .eq("machine_id", machineId)
    .eq("is_bookable", true)
    .order("base_price");

  if (error || !data) return [];
  return data;
}

/** Fetch a single package by slug with its addons. */
export async function getPackageBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select(
      `id, name, slug, machine_id, tier, base_price, duration_days,
       features_json, is_bookable, description, created_at,
       package_addons ( id, name, price, description, capability_slug ),
       machines ( id, name, slug )`
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
}
