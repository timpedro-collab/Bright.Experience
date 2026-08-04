/** Outbound delivery of captured leads to event-scoped webhook subscriptions. */
import "server-only";

import { createHmac } from "node:crypto";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface DeliverableLead {
  id: string;
  eventId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  customFields: Record<string, unknown> | null;
  source: string;
  capturedAt: string;
  emailStatus: string;
  isRepeatPlayer: boolean;
}

interface WebhookSubscriptionRow {
  id: string;
  url: string;
  secret: string;
  events: unknown;
  failure_count: number;
}

function handlesLeadCaptured(events: unknown): boolean {
  return Array.isArray(events) && events.includes("lead.captured");
}

function buildPayload(lead: DeliverableLead) {
  return {
    type: "lead.captured" as const,
    sent_at: new Date().toISOString(),
    data: {
      id: lead.id,
      event_id: lead.eventId,
      contact_name: lead.contactName,
      contact_email: lead.contactEmail,
      contact_phone: lead.contactPhone,
      custom_fields: lead.customFields,
      source: lead.source,
      captured_at: lead.capturedAt,
      email_status: lead.emailStatus,
      is_repeat_player: lead.isRepeatPlayer,
    },
  };
}

/** HMAC-SHA256 hex digest prefixed for outbound Bright.Blue webhooks. */
function signBody(rawBody: string, secret: string): string {
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${hex}`;
}

/**
 * POST the lead to every active lead.captured subscription for its event.
 * Returns per-subscription outcomes aggregated as delivered/failed counts.
 *
 * No in-process retries — the next captured lead is the retry attempt.
 */
export async function deliverLeadToSubscriptions(
  lead: DeliverableLead,
): Promise<{ delivered: number; failed: number }> {
  let delivered = 0;
  let failed = 0;

  try {
    const supabase = getServiceRoleClient();
    const { data: rows, error } = await supabase
      .from("webhook_subscriptions")
      .select("id, url, secret, events, failure_count")
      .eq("event_id", lead.eventId)
      .eq("is_active", true);

    if (error || !rows?.length) {
      return { delivered: 0, failed: 0 };
    }

    const subscriptions = (rows as WebhookSubscriptionRow[]).filter((row) =>
      handlesLeadCaptured(row.events),
    );

    if (subscriptions.length === 0) {
      return { delivered: 0, failed: 0 };
    }

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const payload = buildPayload(lead);
          const rawBody = JSON.stringify(payload);
          const response = await fetch(sub.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-BrightBlue-Signature": signBody(rawBody, sub.secret),
              "X-BrightBlue-Event": "lead.captured",
            },
            body: rawBody,
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            delivered += 1;
            await supabase
              .from("webhook_subscriptions")
              .update({
                last_triggered_at: new Date().toISOString(),
                failure_count: 0,
              })
              .eq("id", sub.id);
            return;
          }

          failed += 1;
          const nextFailures = (sub.failure_count ?? 0) + 1;
          const update: Record<string, unknown> = {
            failure_count: nextFailures,
          };
          // Circuit breaker: five consecutive failures disable the endpoint.
          if (nextFailures >= 5) {
            update.is_active = false;
          }
          await supabase
            .from("webhook_subscriptions")
            .update(update)
            .eq("id", sub.id);
        } catch {
          failed += 1;
          const nextFailures = (sub.failure_count ?? 0) + 1;
          const update: Record<string, unknown> = {
            failure_count: nextFailures,
          };
          if (nextFailures >= 5) {
            update.is_active = false;
          }
          await supabase
            .from("webhook_subscriptions")
            .update(update)
            .eq("id", sub.id);
        }
      }),
    );
  } catch (err) {
    console.error("[deliverLeadToSubscriptions] load failed", {
      eventId: lead.eventId,
      err,
    });
  }

  return { delivered, failed };
}
