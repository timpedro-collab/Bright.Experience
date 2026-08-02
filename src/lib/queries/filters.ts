/**
 * Safe construction of PostgREST filter strings.
 *
 * `supabase.or("name.ilike.%" + term + "%")` is string concatenation into a
 * query language. PostgREST treats `,` as a filter separator, `.` as the
 * operator separator and `()` as grouping, so a search box that reaches `.or()`
 * unescaped lets a visitor rewrite the WHERE clause — e.g. searching
 * `x,role.eq.admin` adds a disjunct nobody asked for. RLS still bounds what
 * comes back, but the result set is no longer the one the page promises.
 *
 * PostgREST's escape hatch is a double-quoted value, inside which the
 * separators lose their meaning; `"` and `\` are escaped with a backslash.
 */

/** Characters PostgREST treats as LIKE wildcards in `like` / `ilike`. */
const LIKE_WILDCARDS = /[%_*]/g;

/**
 * Quote a value for use inside a PostgREST filter string.
 *
 * @returns the value wrapped in double quotes, with `\` and `"` escaped.
 */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Build an `ilike` contains-filter for a free-text search term.
 *
 * User-supplied wildcards are stripped rather than escaped: PostgREST has no
 * way to pass an ESCAPE clause, and a search for `%` matching every row is
 * both surprising and a sequential scan.
 */
export function ilikeContains(column: string, term: string): string {
  const cleaned = term.replace(LIKE_WILDCARDS, "").trim();
  return `${column}.ilike.${quoteFilterValue(`%${cleaned}%`)}`;
}

/**
 * Build an `in` filter from a list of ids.
 *
 * Ids come from our own database rather than the request, but they still pass
 * through the same quoting so a stray character can never end the list early.
 */
export function inList(column: string, values: readonly string[]): string {
  return `${column}.in.(${values.map(quoteFilterValue).join(",")})`;
}

/** Join filter fragments into the string `.or()` expects. */
export function anyOf(...fragments: string[]): string {
  return fragments.filter(Boolean).join(",");
}

/**
 * True when a search term has nothing left to match on after cleaning.
 * Callers skip the filter entirely rather than searching for `%%`.
 */
export function isEmptySearch(term: string | null | undefined): boolean {
  return !term || term.replace(LIKE_WILDCARDS, "").trim().length === 0;
}
