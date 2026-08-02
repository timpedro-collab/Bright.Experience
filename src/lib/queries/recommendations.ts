/** Supabase read queries for recommendation entities. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Fetch recommendations, optionally filtered by category. */
export async function getRecommendations(category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("recommendations")
    .select(
      `id, category, context_json, recommendation_json,
       confidence_score, sample_size, updated_at`
    )
    .order("confidence_score", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error || !data) {
    logQueryError("getRecommendations", error);
    return [];
  }
  return data;
}
