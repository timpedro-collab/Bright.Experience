/** Supabase read queries for recommendation entities. */
import { createClient } from "@/lib/supabase/server";

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
  if (error || !data) return [];
  return data;
}

/** Fetch recommendations matching a given context (event type, objective, etc.). */
export async function getRecommendationsForContext(context: {
  eventType?: string;
  objective?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("recommendations")
    .select(
      `id, category, context_json, recommendation_json,
       confidence_score, sample_size, updated_at`
    )
    .order("confidence_score", { ascending: false });

  if (context.eventType) {
    query = query.contains("context_json", { eventType: context.eventType });
  }
  if (context.objective) {
    query = query.contains("context_json", { objective: context.objective });
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}
