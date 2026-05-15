/** Supabase read queries for event reports (proof of performance). */
import { createClient } from "@/lib/supabase/server";
import type { EventReport } from "@/types";

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

  if (error || !data) return [];
  return data.map(mapEventReport);
}

/** Fetch a single report by its ID. */
export async function getEventReportById(
  id: string
): Promise<EventReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapEventReport(data);
}

/** Fetch a published report by its public share token. */
export async function getEventReportByShareToken(
  token: string
): Promise<EventReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("share_token", token)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  return mapEventReport(data);
}

/** Fetch all published reports (internal dashboard listing). */
export async function getPublishedReports(): Promise<EventReport[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_reports")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return data.map(mapEventReport);
}
