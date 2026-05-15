/**
 * pipedrive_outbox drain worker.
 *
 * Pulls pending rows, calls Pipedrive, marks each row sent/failed.
 *
 * Two entry points share the same worker:
 *   - `drainOutbox()` called from `enqueue*()` helpers immediately
 *     after inserting a row — happy-path single-row drain so the deal
 *     gets updated within a couple of seconds when Pipedrive is healthy.
 *   - `drainOutbox()` called from `/api/cron/pipedrive` once an hour —
 *     sweeps anything that failed inline (network blip, 429, etc).
 *
 * Failure policy: each row gets up to 3 attempts. After that we keep
 * the row around but stop touching it — the admin page surfaces it so
 * a human can intervene. We never throw out of this function: any
 * exception is caught and stored on the row so the next caller (or
 * the cron) sees it.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  addNoteToDeal,
  getDeal,
  updateDealCustomFields,
  loadPipedriveConfig,
  type PipedriveConfig,
} from "./client";

const MAX_ATTEMPTS = 3;
const DEFAULT_BATCH_SIZE = 25;

export interface DrainResult {
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

interface OutboxRow {
  id: string;
  event_id: string | null;
  deal_id: string | null;
  kind: "note" | "custom_field_update";
  payload: Record<string, unknown>;
  attempts: number;
}

/**
 * Drain up to `limit` pending outbox rows. If `singleId` is provided we
 * only attempt that one row (used by the inline send-after-enqueue
 * path to avoid head-of-line blocking when there are older failed
 * rows ahead in the queue).
 */
export async function drainOutbox(
  options: { limit?: number; singleId?: string } = {}
): Promise<DrainResult> {
  const limit = options.limit ?? DEFAULT_BATCH_SIZE;
  const config = await loadPipedriveConfig();
  if (!config) {
    return { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
  }

  const supabase = getServiceRoleClient();
  let query = supabase
    .from("pipedrive_outbox")
    .select("id, event_id, deal_id, kind, payload, attempts")
    .is("sent_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (options.singleId) query = query.eq("id", options.singleId);
  const { data, error } = await query;
  if (error || !data) {
    return { attempted: 0, succeeded: 0, failed: 0, skipped: 0 };
  }

  const rows = data as unknown as OutboxRow[];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.deal_id) {
      // Defensive — should never happen, but skip rather than infinite-retry.
      await markFailed(row.id, row.attempts, "missing_deal_id");
      skipped += 1;
      continue;
    }
    const result = await processRow(config, row);
    if (result.ok) {
      await markSent(row.id);
      succeeded += 1;
    } else {
      await markFailed(row.id, row.attempts, result.reason);
      failed += 1;
    }
  }

  return { attempted: rows.length, succeeded, failed, skipped };
}

async function processRow(
  config: PipedriveConfig,
  row: OutboxRow
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    if (row.kind === "note") {
      const content = (row.payload as { content?: string }).content;
      if (!content) return { ok: false, reason: "missing_content" };
      const res = await addNoteToDeal(config, row.deal_id!, content);
      return res.ok ? { ok: true } : { ok: false, reason: res.reason };
    }
    if (row.kind === "custom_field_update") {
      const fields = (row.payload as { fields?: Record<string, unknown> }).fields;
      if (!fields || Object.keys(fields).length === 0) {
        return { ok: false, reason: "missing_fields" };
      }
      // Resolve any read-modify-write sentinels (currently only used
      // for the delivered-events counter) before sending.
      const resolved = await resolveIncrementSentinels(config, row.deal_id!, fields);
      if (!resolved.ok) return resolved;
      const res = await updateDealCustomFields(
        config,
        row.deal_id!,
        resolved.fields
      );
      return res.ok ? { ok: true } : { ok: false, reason: res.reason };
    }
    return { ok: false, reason: `unknown_kind:${row.kind}` };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unhandled_error",
    };
  }
}

/**
 * Walk the field patch looking for the `__increment__` sentinel.
 * For any key carrying it, fetch the deal once, read the current
 * numeric value, and replace the sentinel with `current + 1`.
 */
async function resolveIncrementSentinels(
  config: PipedriveConfig,
  dealId: string,
  fields: Record<string, unknown>
): Promise<{ ok: true; fields: Record<string, unknown> } | { ok: false; reason: string }> {
  const incrementKeys = Object.entries(fields)
    .filter(([, v]) => v === "__increment__")
    .map(([k]) => k);
  if (incrementKeys.length === 0) return { ok: true, fields };

  const dealRes = await getDeal(config, dealId);
  if (!dealRes.ok) return { ok: false, reason: dealRes.reason };

  const dealRow = dealRes.data as unknown as Record<string, unknown>;
  const resolved: Record<string, unknown> = { ...fields };
  for (const key of incrementKeys) {
    const raw = dealRow[key];
    const current = typeof raw === "number" ? raw : Number(raw ?? 0);
    resolved[key] = Number.isFinite(current) ? current + 1 : 1;
  }
  return { ok: true, fields: resolved };
}

async function markSent(id: string): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase
    .from("pipedrive_outbox")
    .update({ sent_at: new Date().toISOString(), last_error: null })
    .eq("id", id);
}

async function markFailed(
  id: string,
  currentAttempts: number,
  reason: string
): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase
    .from("pipedrive_outbox")
    .update({
      attempts: currentAttempts + 1,
      last_error: reason.slice(0, 500),
    })
    .eq("id", id);
}
