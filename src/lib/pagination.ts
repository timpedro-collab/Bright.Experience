/** Shared pagination utilities for Supabase list queries. */

export const PAGE_SIZE = 25;

/**
 * Extract the current page number from URL search params.
 * Returns 1 when absent or invalid (always >= 1).
 */
export function parsePage(
  searchParams: Record<string, string | string[] | undefined>
): number {
  const raw = searchParams.page;
  const n = typeof raw === "string" ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/**
 * Append `.range()` pagination to a Supabase query builder.
 *
 * Returns the same builder (for chaining) after clamping the page to
 * a zero-indexed `[from, to]` range compatible with PostgREST.
 */
export function paginateQuery<Q extends { range: (from: number, to: number) => Q }>(
  query: Q,
  page: number,
  pageSize: number = PAGE_SIZE
): Q {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

/** Derive total page count from a row count and page size. */
export function totalPages(count: number, pageSize: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / pageSize));
}
