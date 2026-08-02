/**
 * Idempotency keys for inbound Cloud telemetry.
 *
 * Bright.Blue Cloud retries a webhook on any non-2xx response and on a timeout,
 * so the same batch can arrive more than once. Every ingested row therefore
 * carries an `external_event_id` that a redelivery reproduces exactly, and the
 * insert becomes an upsert that ignores conflicts.
 */

import { createHash } from "node:crypto";

/** Prefix for ids the sender supplied, so they can never collide with derived ones. */
const SENDER_PREFIX = "bb";
/** Prefix for ids we derived from the payload itself. */
const DERIVED_PREFIX = "batch";

/**
 * Stable digest of a raw request body.
 *
 * Taken over the raw bytes rather than the parsed object because a redelivery
 * repeats the bytes, while re-serialising a parsed object can reorder keys.
 */
export function batchDigest(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex").slice(0, 32);
}

/**
 * The idempotency key for one item in a telemetry batch.
 *
 * Prefers the sender's own id (`id`, or `event_id` on the item — Cloud has used
 * both spellings). Falls back to the batch digest plus the item's position,
 * which is stable across a byte-identical redelivery and unique within the
 * batch. Position is part of the key deliberately: a batch may legitimately
 * contain two identical events, e.g. two plays inside the same second.
 */
export function telemetryExternalId(
  item: Record<string, unknown>,
  digest: string,
  index: number
): string {
  const senderId = item.id ?? item.event_id;
  if (senderId != null && String(senderId).trim()) {
    return `${SENDER_PREFIX}:${String(senderId).trim()}`;
  }
  return `${DERIVED_PREFIX}:${digest}:${index}`;
}
