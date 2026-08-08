/** Supabase read queries for event reports (proof of performance). */
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { EventReport } from "@/types";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Published report row exposed on the anonymous share page. */
export type SharedEventReport = EventReport & {
  brandPartnerId: string | null;
};

/** Map a database row to a camelCase EventReport. */
function mapEventReport(row: Record<string, unknown>): EventReport {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    reportType: row.report_type as EventReport["reportType"],
    title: row.title as string,
    metricsJson: (row.metrics_json ?? {}) as Record<string, unknown>,
    predictionsJson: (row.predictions_json ?? {}) as Record<string, unknown>,
    comparisonJson: (row.comparison_json ?? {}) as Record<string, unknown>,
    highlightsJson: (row.highlights_json ?? []) as Record<string, unknown>[],
    shareToken: row.share_token as string | undefined,
    generatedAt: row.generated_at as string,
    isPublished: row.is_published as boolean,
    publishedAt: row.published_at as string | undefined,
    personalNote: (row.personal_note as string | null) ?? undefined,
    personalNoteAuthor: (row.personal_note_author as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Fetch all reports for a given event. */
export async function getEventReports(
  eventId: string
): Promise<EventReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("event_id", eventId)
    .order("generated_at", { ascending: false });

  if (error || !data) {
    logQueryError("getEventReports", error, { eventId });
    return [];
  }
  return data.map(mapEventReport);
}
/** Fetch a published report by its public share token. */
export async function getEventReportByShareToken(
  token: string
): Promise<SharedEventReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("share_token", token)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    logQueryError("getEventReportByShareToken", error, { token });
    return null;
  }
  return {
    ...mapEventReport(data),
    brandPartnerId: data.brand_partner_id
      ? String(data.brand_partner_id)
      : null,
  };
}

/**
 * Narrow event summary for public report surfaces (Wrapped, share cards).
 * The visitor is anonymous, so this is a service-role read restricted to
 * display-safe fields — never the full event row.
 */
export async function getEventSummaryForReport(eventId: string): Promise<{
  name: string;
  eventType: string;
  eventDateStart: string;
  eventDateEnd: string | null;
} | null> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .select("name, event_type, event_date_start, event_date_end")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) {
    if (error) logQueryError("getEventSummaryForReport", error, { eventId });
    return null;
  }
  return {
    name: String(data.name),
    eventType: String(data.event_type ?? "activation"),
    eventDateStart: String(data.event_date_start),
    eventDateEnd: data.event_date_end ? String(data.event_date_end) : null,
  };
}
