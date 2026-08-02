/** Supabase read queries for the case studies catalog entity */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import { applyPublicationRights } from "@/lib/publication-rights";

/** Fetch all published case studies, newest first. */
export async function getCaseStudies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select(
      "id, title, slug, client_name, event_type, location, hero_image_url, stats_json, published_at, publication_rights, anonymised_label, testimonial_author"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error) {
    logQueryError("getCaseStudies", error);
    return [];
  }
  return applyPublicationRights(data ?? []);
}

/** Fetch a single published case study by slug. */
export async function getCaseStudyBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    logQueryError("getCaseStudyBySlug", error, { slug });
    return null;
  }
  if (!data) return null;
  const [processed] = applyPublicationRights([data]);
  return processed ?? null;
}
