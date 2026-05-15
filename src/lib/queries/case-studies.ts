/** Supabase read queries for the case studies catalog entity */
import { createClient } from "@/lib/supabase/server";

/** Fetch all published case studies, newest first */
export async function getCaseStudies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, title, slug, client_name, event_type, location, hero_image_url, stats_json, published_at"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

/** Fetch a single published case study by slug */
export async function getCaseStudyBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  return data;
}
