/**
 * Stale-subject predicates for the reminder cron.
 *
 * Each case collects every subject that *could* warrant a nudge for a given
 * archetype. We deliberately keep these predicates short-form rather than a
 * generic engine — the set of archetypes is bounded and each predicate is
 * obvious at the call site.
 */

import type { NotificationKind } from "@/lib/notifications/archetypes";
import type { ReminderClient } from "./client";

export interface StaleSubject {
  kind: NotificationKind;
  subjectType: string;
  subjectId: string;
  /** Anchor date used to compute staleness against the cadence. */
  anchor: string;
  /** Context bag forwarded to the dispatcher. */
  context: Record<string, string | number | null | undefined>;
}

export async function findStaleSubjects(
  supabase: ReminderClient,
  kind: NotificationKind
): Promise<StaleSubject[]> {
  switch (kind) {
    case "asset.review_needed": {
      const { data } = await supabase
        .from("assets")
        .select(
          "id, event_id, name, updated_at, events(name), uploader:profiles!assets_uploaded_by_fkey(name)"
        )
        .eq("review_status", "pending_review")
        .not("file_url", "is", null);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          const uploader = r.uploader as { name?: string } | null;
          return {
            kind,
            subjectType: "asset",
            subjectId: String(r.id),
            anchor: String(r.updated_at),
            context: {
              eventId: String(r.event_id),
              assetId: String(r.id),
              assetName: String(r.name),
              eventName: events?.name ?? "an upcoming event",
              contactName: uploader?.name ?? "A customer",
              entityType: "asset",
              entityId: String(r.id),
            },
          };
        }
      );
    }

    case "approval.requested": {
      const { data } = await supabase
        .from("approvals")
        .select("id, event_id, requested_at, events(name)")
        .eq("status", "pending");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          return {
            kind,
            subjectType: "approval",
            subjectId: String(r.id),
            anchor: String(r.requested_at),
            context: {
              eventId: String(r.event_id),
              approvalId: String(r.id),
              eventName: events?.name ?? "your event",
              entityType: "approval",
              entityId: String(r.id),
            },
          };
        }
      );
    }

    case "asset.revision_requested": {
      const { data } = await supabase
        .from("assets")
        .select(
          "id, event_id, name, review_decided_at, review_feedback, events(name)"
        )
        .eq("review_status", "revision_requested");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          return {
            kind,
            subjectType: "asset",
            subjectId: String(r.id),
            anchor: String(r.review_decided_at ?? r.updated_at ?? ""),
            context: {
              eventId: String(r.event_id),
              assetId: String(r.id),
              assetName: String(r.name),
              eventName: events?.name ?? "your event",
              feedback: (r.review_feedback as string) ?? "",
              entityType: "asset",
              entityId: String(r.id),
            },
          };
        }
      );
    }

    case "briefing.needed": {
      const { data } = await supabase
        .from("briefing_responses")
        .select("event_id, form_type, updated_at, is_submitted, events(name)")
        .eq("is_submitted", false);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          return {
            kind,
            subjectType: "briefing",
            subjectId: String(r.event_id),
            anchor: String(r.updated_at),
            context: {
              eventId: String(r.event_id),
              eventName: events?.name ?? "your event",
              entityType: "briefing_response",
              entityId: String(r.event_id),
            },
          };
        }
      );
    }

    case "proposal.delivered": {
      const { data } = await supabase
        .from("quotes")
        .select("id, contact_name, company_name, updated_at")
        .eq("status", "proposal_sent");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "quote",
          subjectId: String(r.id),
          anchor: String(r.updated_at),
          context: {
            quoteId: String(r.id),
            contactName: String(r.contact_name),
            eventName: (r.company_name as string) ?? "your event",
            entityType: "quote",
            entityId: String(r.id),
          },
        })
      );
    }

    case "proposal.intake_received": {
      const { data } = await supabase
        .from("quotes")
        .select("id, contact_name, created_at")
        .eq("status", "submitted")
        .eq("track", "proposal");
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "quote",
          subjectId: String(r.id),
          anchor: String(r.created_at),
          context: {
            quoteId: String(r.id),
            contactName: String(r.contact_name),
            entityType: "quote",
            entityId: String(r.id),
          },
        })
      );
    }

    case "task.overdue": {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("tasks")
        .select("id, event_id, title, due_date, status")
        .not("status", "in", '("complete","skipped")')
        .not("due_date", "is", null)
        .lt("due_date", today);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "task",
          subjectId: String(r.id),
          anchor: String(r.due_date),
          context: {
            eventId: String(r.event_id),
            taskId: String(r.id),
            taskTitle: String(r.title),
            dueDate: String(r.due_date),
            entityType: "task",
            entityId: String(r.id),
          },
        })
      );
    }

    case "studio.request_submitted": {
      const { data } = await supabase
        .from("studio_requests")
        .select("id, event_id, title, service_type, created_at")
        .in("status", ["submitted", "draft"]);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => ({
          kind,
          subjectType: "studio_request",
          subjectId: String(r.id),
          anchor: String(r.created_at),
          context: {
            eventId: String(r.event_id),
            studioRequestId: String(r.id),
            title: String(r.title),
            serviceType: String(r.service_type),
            entityType: "studio_request",
            entityId: String(r.id),
          },
        })
      );
    }

    case "asset.upload_needed": {
      const { data } = await supabase
        .from("assets")
        .select("id, event_id, name, due_date, created_at, events(name)")
        .eq("status", "required")
        .eq("customer_visible", true);
      return ((data ?? []) as unknown as Record<string, unknown>[]).map(
        (r) => {
          const events = r.events as { name?: string } | null;
          return {
            kind,
            subjectType: "asset",
            subjectId: String(r.id),
            anchor: String(r.due_date ?? r.created_at),
            context: {
              eventId: String(r.event_id),
              assetId: String(r.id),
              assetName: String(r.name),
              eventName: events?.name ?? "your event",
              entityType: "asset",
              entityId: String(r.id),
            },
          };
        }
      );
    }

    default:
      return [];
  }
}
