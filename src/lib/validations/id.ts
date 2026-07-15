/** Shared id validation for entity references. */
import { z } from "zod";

/**
 * UUID-shaped id (8-4-4-4-12 hex). Intentionally looser than zod's strict
 * RFC-4122 `.uuid()` because seeded/demo rows use readable hand-crafted ids
 * (e.g. `e1111111-1111-1111-1111-111111111111`) that carry non-compliant
 * version/variant nibbles.
 */
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuidLike(message: string) {
  return z.string().regex(UUID_SHAPE, message);
}
