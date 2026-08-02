/**
 * Chunking for PostgREST `in.(...)` filters.
 *
 * PostgREST filters travel in the query string, and the gateway in front of it
 * caps the request line — a long `in.(...)` list comes back `414 URI Too Long`
 * and the whole statement is lost. The purge cron hit this with a 10,000-id
 * delete: the request failed every night while the run still reported the ids
 * as purged.
 *
 * Measured against the local Supabase gateway: 200 UUIDs (~7.4 KB of query
 * string) is accepted, 300 (~11 KB) is rejected, so the ceiling sits at the
 * usual 8 KB. 100 ids is ~3.7 KB, which leaves room for the rest of the URL
 * and for quoted values, while keeping round-trips low.
 */

/** Default ids per request. Tuned for 36-character UUIDs under an 8 KB URL cap. */
export const IN_CHUNK_SIZE = 100;

/** Split a list into consecutive chunks of at most `size`. */
export function chunk<T>(
  items: readonly T[],
  size: number = IN_CHUNK_SIZE
): T[][] {
  if (size < 1) throw new Error("chunk: size must be at least 1");

  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Run `fn` once per chunk of ids, sequentially, and collect the results.
 *
 * Sequential on purpose: these run inside cron handlers where a burst of
 * parallel writes competes with live request traffic for connections.
 *
 * @returns the flattened results of every call.
 */
export async function forEachChunk<T, R>(
  items: readonly T[],
  fn: (batch: T[]) => Promise<R[]>,
  size: number = IN_CHUNK_SIZE
): Promise<R[]> {
  const out: R[] = [];
  for (const batch of chunk(items, size)) {
    out.push(...(await fn(batch)));
  }
  return out;
}
