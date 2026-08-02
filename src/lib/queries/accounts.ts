/** Supabase read queries for the accounts entity. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import { isEmptySearch } from "@/lib/queries/filters";

/** Cap on the id list a name search can produce, since it becomes an `IN`. */
const MAX_MATCHES = 200;

/**
 * Account ids whose name matches a free-text term.
 *
 * Exists so event searches can span "event name OR customer name" without
 * asking PostgREST to OR across an embedded resource — `accounts.name` inside
 * a top-level `or=` is not a column it can resolve, so the whole filter is
 * rejected and the swallowed error renders as "no events found". Resolving the
 * accounts first costs one extra round-trip and actually works.
 */
export async function findAccountIdsByName(
  // Accepts a caller-supplied client so the search runs inside the same
  // RLS scope as the query it is filtering.
  supabase: Awaited<ReturnType<typeof createClient>>,
  term: string
): Promise<string[]> {
  if (isEmptySearch(term)) return [];

  const { data, error } = await supabase
    .from("accounts")
    .select("id")
    .ilike("name", `%${term.replace(/[%_*]/g, "").trim()}%`)
    .limit(MAX_MATCHES);

  if (error || !data) {
    logQueryError("findAccountIdsByName", error);
    return [];
  }
  return (data as { id: string }[]).map((row) => row.id);
}
