/** Helpers for reading PostgREST embedded resources. */

/**
 * Take the single related row out of a PostgREST embed.
 *
 * PostgREST returns an embedded resource as an object when it can prove the
 * relationship is to-one, and as an array when it can't — which depends on the
 * foreign keys and hints in play, not on the data. Call sites that want "the
 * one related row" must handle both or they break the moment a constraint
 * changes underneath them.
 */
export function firstRelated<T = Record<string, unknown>>(
  value: unknown
): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value as T;
}
