/**
 * High-signal Pipedrive trigger helpers.
 *
 * Each helper takes the minimum data the formatter needs, writes one
 * (or two) rows into `pipedrive_outbox`, and kicks off an inline drain
 * so the happy-path latency is "Pipedrive sees the note within a few
 * seconds." Nothing here ever throws — Pipedrive being down or
 * misconfigured must not break a domain action like accepting a quote.
 *
 * The six triggers (see plan, PR 3 table):
 *   - enqueueDealKickoff
 *   - enqueueStageAdvance
 *   - enqueueApprovalDecision
 *   - enqueueAssetReviewDecision
 *   - enqueueEventLive
 *   - enqueueEventDelivered
 *
 * Each writes:
 *   - One note (kind = 'note')
 *   - One custom-field update (kind = 'custom_field_update') if the
 *     three field keys are configured.
 *
 * Events without `pipedrive_deal_id` are silently skipped — the
 * integration is opt-in per event, so unlinked events stay invisible.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { drainOutbox } from "./drain";
import { loadPipedriveConfig } from "./client";
import {
  formatApprovalDecisionNote,
  formatAssetReviewDecisionNote,
  formatDealKickoffNote,
  formatEventDeliveredNote,
  formatEventLiveNote,
  formatStageAdvanceNote,
  type EventLite,
  type NotePayload,
} from "./format";
import type { HealthStatus, Stage } from "@/types";
import { STAGE_CONFIG } from "@/types";

/** Look up the linked Pipedrive deal for an event. */
async function getDealIdForEvent(eventId: string): Promise<string | null> {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("events")
      .select("pipedrive_deal_id")
      .eq("id", eventId)
      .maybeSingle();
    const row = data as { pipedrive_deal_id?: string | null } | null;
    return row?.pipedrive_deal_id ?? null;
  } catch {
    return null;
  }
}

/** Fetch the event row we need to build a note (name + account). */
async function getEventLite(eventId: string): Promise<EventLite | null> {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, accounts(name)")
      .eq("id", eventId)
      .maybeSingle();
    const row = data as
      | { id: string; name: string; accounts?: { name?: string } | null }
      | null;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      account: row.accounts ? { name: row.accounts.name } : null,
    };
  } catch {
    return null;
  }
}

/**
 * Insert a note row plus (optionally) a custom-field update row, then
 * drain inline. Returns silently on any failure — the cron will catch
 * anything left behind.
 */
async function enqueueAndDrain(
  eventId: string,
  dealId: string,
  note: NotePayload,
  customFieldUpdates: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getServiceRoleClient();

    const rows: Array<Record<string, unknown>> = [
      {
        event_id: eventId,
        deal_id: dealId,
        kind: "note",
        payload: { title: note.title, content: note.body },
      },
    ];
    if (Object.keys(customFieldUpdates).length > 0) {
      rows.push({
        event_id: eventId,
        deal_id: dealId,
        kind: "custom_field_update",
        payload: { fields: customFieldUpdates },
      });
    }

    const { data, error } = await supabase
      .from("pipedrive_outbox")
      .insert(rows)
      .select("id");
    if (error || !data) return;

    // Fire-and-forget inline drain for each row we just inserted.
    // Errors get persisted on the row itself, so the cron picks up
    // anything that didn't make it through.
    for (const row of data as Array<{ id: string }>) {
      await drainOutbox({ singleId: row.id, limit: 1 });
    }
  } catch {
    // Pipedrive is opt-in; absorb all failures silently.
  }
}

/**
 * Map Bright.Experience health → Pipedrive single-option ID. Returns
 * `null` if the integration hasn't been wired to a health enum yet.
 */
function healthOptionId(
  health: HealthStatus,
  config: {
    healthOptionGreenId: number | null;
    healthOptionAmberId: number | null;
    healthOptionRedId: number | null;
  }
): number | null {
  if (health === "green") return config.healthOptionGreenId;
  if (health === "amber") return config.healthOptionAmberId;
  return config.healthOptionRedId;
}

/**
 * Build the custom-fields patch for a trigger. Skips fields whose key
 * hasn't been configured so we don't accidentally clobber unset values.
 */
async function buildFieldUpdates(options: {
  touchActivity?: boolean;
  health?: HealthStatus | null;
  incrementDelivered?: boolean;
}): Promise<Record<string, unknown>> {
  const config = await loadPipedriveConfig();
  if (!config) return {};

  const fields: Record<string, unknown> = {};
  if (options.touchActivity && config.fieldKeyLastActivityAt) {
    // Pipedrive date custom fields expect ISO date (yyyy-MM-dd).
    fields[config.fieldKeyLastActivityAt] = new Date()
      .toISOString()
      .split("T")[0];
  }
  if (options.health && config.fieldKeyHealthStatus) {
    const optionId = healthOptionId(options.health, config);
    if (optionId !== null) {
      fields[config.fieldKeyHealthStatus] = optionId;
    }
  }
  if (options.incrementDelivered && config.fieldKeyDeliveredEvents) {
    // We can't read-modify-write on the queue alone — set the value
    // to a placeholder marker; the drain pre-processes it by fetching
    // the current value first. Simplest reliable path: write a
    // simple count via a separate read on send. For v1 we just bump
    // the field to "1" if unset; future improvement: increment with
    // a Pipedrive GET/PUT chain.
    fields[config.fieldKeyDeliveredEvents] = "__increment__";
  }
  return fields;
}

/**
 * Trigger 1 — proposal accepted, event created. First note of the
 * deal's delivery life.
 */
export async function enqueueDealKickoff(eventId: string): Promise<void> {
  const [dealId, event] = await Promise.all([
    getDealIdForEvent(eventId),
    getEventLite(eventId),
  ]);
  if (!dealId || !event) return;
  const note = formatDealKickoffNote(event);
  const fields = await buildFieldUpdates({
    touchActivity: true,
    health: "green",
  });
  await enqueueAndDrain(eventId, dealId, note, fields);
}

/**
 * Trigger 2 — stage advancement. Only writes for the customer-visible
 * stages listed in the plan; any other stage advance is a no-op so
 * the Pipedrive feed doesn't become a debugging stream.
 */
const CUSTOMER_VISIBLE_STAGES = new Set<Stage>([
  "creative_assets",
  "approvals",
  "qa_readiness",
  "event_live",
  "reporting",
]);

export async function enqueueStageAdvance(
  eventId: string,
  toStage: Stage
): Promise<void> {
  if (!CUSTOMER_VISIBLE_STAGES.has(toStage)) return;
  const [dealId, event] = await Promise.all([
    getDealIdForEvent(eventId),
    getEventLite(eventId),
  ]);
  if (!dealId || !event) return;
  const order = STAGE_CONFIG[toStage]?.order ?? 0;
  const percentComplete = Math.round((order / 9) * 100);
  const note = formatStageAdvanceNote(event, toStage, percentComplete);
  const fields = await buildFieldUpdates({ touchActivity: true });
  await enqueueAndDrain(eventId, dealId, note, fields);
}

/**
 * Trigger 3 — customer approved or asked for revisions on an
 * internal-prepared approval (proof, layout, copy, etc).
 */
export async function enqueueApprovalDecision(
  eventId: string,
  approvalTitle: string,
  decision: "approved" | "revision_requested",
  feedback?: string
): Promise<void> {
  const [dealId, event] = await Promise.all([
    getDealIdForEvent(eventId),
    getEventLite(eventId),
  ]);
  if (!dealId || !event) return;
  const note = formatApprovalDecisionNote(
    event,
    approvalTitle,
    decision,
    feedback
  );
  const fields = await buildFieldUpdates({
    touchActivity: true,
    health: decision === "revision_requested" ? "amber" : null,
  });
  await enqueueAndDrain(eventId, dealId, note, fields);
}

/**
 * Trigger 4 — Bright.Blue creative team reviewed a customer-uploaded
 * asset. Mirror of trigger 3 from the other direction.
 */
export async function enqueueAssetReviewDecision(
  eventId: string,
  assetName: string,
  decision: "approved" | "revision_requested",
  feedback?: string
): Promise<void> {
  const [dealId, event] = await Promise.all([
    getDealIdForEvent(eventId),
    getEventLite(eventId),
  ]);
  if (!dealId || !event) return;
  const note = formatAssetReviewDecisionNote(
    event,
    assetName,
    decision,
    feedback
  );
  const fields = await buildFieldUpdates({ touchActivity: true });
  await enqueueAndDrain(eventId, dealId, note, fields);
}

/** Trigger 5 — event went live. Usually fires from the cron sweep. */
export async function enqueueEventLive(eventId: string): Promise<void> {
  const [dealId, eventFull] = await Promise.all([
    getDealIdForEvent(eventId),
    fetchEventFull(eventId),
  ]);
  if (!dealId || !eventFull) return;
  const note = formatEventLiveNote(
    eventFull,
    eventFull.venueName,
    eventFull.eventDateStart
  );
  const fields = await buildFieldUpdates({ touchActivity: true });
  await enqueueAndDrain(eventId, dealId, note, fields);
}

/** Trigger 6 — event delivered, final report ready. */
export async function enqueueEventDelivered(
  eventId: string,
  leadCount: number,
  reportLink?: string
): Promise<void> {
  const [dealId, event] = await Promise.all([
    getDealIdForEvent(eventId),
    getEventLite(eventId),
  ]);
  if (!dealId || !event) return;
  const note = formatEventDeliveredNote(event, leadCount, reportLink);
  const fields = await buildFieldUpdates({
    touchActivity: true,
    incrementDelivered: true,
  });
  await enqueueAndDrain(eventId, dealId, note, fields);
}

async function fetchEventFull(eventId: string): Promise<
  | (EventLite & { eventDateStart: string; venueName?: string })
  | null
> {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, venue_name, event_date_start, accounts(name)")
      .eq("id", eventId)
      .maybeSingle();
    const row = data as
      | {
          id: string;
          name: string;
          venue_name?: string | null;
          event_date_start: string;
          accounts?: { name?: string } | null;
        }
      | null;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      account: row.accounts ? { name: row.accounts.name } : null,
      eventDateStart: row.event_date_start,
      venueName: row.venue_name ?? undefined,
    };
  } catch {
    return null;
  }
}
