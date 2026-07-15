/**
 * GET /api/events/:id/export?format=pdf|csv|excel&view=reports|live|leads
 *
 * Generates and returns an export of the specified dashboard view
 * in the requested format. Auth required.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { toCsv, csvResponse } from "@/lib/exports/csv";
import { excelResponse } from "@/lib/exports/excel";
import { generatePdf } from "@/lib/exports/pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  const view = url.searchParams.get("view") ?? "reports";

  // Resolve the caller's role + account up front so we can both scope the
  // event lookup and gate section access against the same source of truth.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_id")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role ?? null;

  // Verify user can access this event. Customers are scoped to their own
  // account so they can't export another account's event by guessing its id;
  // production enforces this via RLS, the mock client does not.
  let eventQuery = supabase.from("events").select("id, name").eq("id", id);
  if (role && !isInternalRole(role) && profile?.account_id) {
    eventQuery = eventQuery.eq("account_id", profile.account_id);
  }
  const { data: eventAccess } = await eventQuery.maybeSingle();

  if (!eventAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (view === "leads" && !(role && canViewSection(role, "leads"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isReportsView = view === "reports" || (format === "pdf" && view !== "live");
  if (isReportsView) {
    if (!(role && canViewSection(role, "reports"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const isInternal = role ? isInternalRole(role) : false;
    if (!isInternal) {
      const { data: latestReport } = await supabase
        .from("event_reports")
        .select("is_published")
        .eq("event_id", id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latestReport || latestReport.is_published !== true) {
        return NextResponse.json(
          { error: "Report not available" },
          { status: 403 },
        );
      }
    }
  }

  const eventName = String(eventAccess.name).replace(/[^a-zA-Z0-9-_ ]/g, "");
  const timestamp = new Date().toISOString().slice(0, 10);

  try {
    if (format === "pdf") {
      return await handlePdfExport(request, id, view, eventName, timestamp);
    }
    if (format === "excel") {
      return await handleExcelExport(supabase, id, view, eventName, timestamp);
    }
    return await handleCsvExport(supabase, id, view, eventName, timestamp);
  } catch (err) {
    console.error(`[export] ${view}/${format} failed:`, err);
    return NextResponse.json(
      { error: "Export generation failed" },
      { status: 500 },
    );
  }
}

async function handlePdfExport(
  request: Request,
  eventId: string,
  view: string,
  eventName: string,
  timestamp: string,
) {
  const origin = new URL(request.url).origin;
  const printPath =
    view === "live"
      ? `/events/${eventId}/live/print`
      : `/events/${eventId}/reports/print`;

  // Forward auth cookies to headless browser
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [name, ...rest] = c.split("=");
      return {
        name: name.trim(),
        value: rest.join("=").trim(),
        domain: new URL(origin).hostname,
      };
    });

  const pdfBuf = await generatePdf({
    url: `${origin}${printPath}`,
    cookies,
    landscape: view === "live",
    waitForSelector: ".recharts-wrapper",
  });

  const filename = `${eventName}-${view}-${timestamp}.pdf`;
  return new Response(new Uint8Array(pdfBuf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function handleCsvExport(
  supabase: SupabaseClient,
  eventId: string,
  view: string,
  eventName: string,
  timestamp: string,
) {
  const data = await fetchExportData(supabase, eventId, view);
  const csv = toCsv(data.rows, { headers: data.headers });
  return csvResponse(csv, `${eventName}-${view}-${timestamp}.csv`);
}

async function handleExcelExport(
  supabase: SupabaseClient,
  eventId: string,
  view: string,
  eventName: string,
  timestamp: string,
) {
  const data = await fetchExportData(supabase, eventId, view);
  return excelResponse(
    [{
      name: data.sheetName,
      columns: data.headers.map((h) => ({ header: h, key: h })),
      rows: data.rows,
    }],
    `${eventName} — ${view}`,
    `${eventName}-${view}-${timestamp}.xlsx`,
  );
}

async function fetchExportData(
  supabase: SupabaseClient,
  eventId: string,
  view: string,
): Promise<{
  headers: string[];
  rows: Record<string, unknown>[];
  sheetName: string;
}> {
  if (view === "leads") {
    // Cap export size so a huge event cannot unbounded-scan / OOM the route.
    const { data } = await supabase
      .from("leads")
      .select("contact_name, contact_email, contact_phone, source, captured_at")
      .eq("event_id", eventId)
      .order("captured_at", { ascending: false })
      .limit(10_000);

    return {
      sheetName: "Leads",
      headers: ["contact_name", "contact_email", "contact_phone", "source", "captured_at"],
      rows: (data ?? []).map((r: Record<string, unknown>) => ({
        contact_name: r.contact_name,
        contact_email: r.contact_email,
        contact_phone: r.contact_phone ?? "",
        source: r.source,
        captured_at: r.captured_at,
      })),
    };
  }

  if (view === "live") {
    const { data: metrics } = await supabase
      .from("event_metrics_snapshot")
      .select("*")
      .eq("event_id", eventId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: machines } = await supabase
      .from("machine_instances")
      .select("serial_number, nickname, status, last_heartbeat")
      .eq("current_event_id", eventId);

    const rows: Record<string, unknown>[] = [
      {
        metric: "Total Plays",
        value: metrics?.total_plays ?? 0,
      },
      {
        metric: "Total Leads",
        value: metrics?.total_leads ?? 0,
      },
      {
        metric: "Total Prizes",
        value: metrics?.total_prizes ?? 0,
      },
      {
        metric: "Avg Dwell Time (s)",
        value: metrics?.avg_dwell_time ?? 0,
      },
    ];

    for (const m of machines ?? []) {
      rows.push({
        metric: `Machine: ${m.nickname ?? m.serial_number}`,
        value: m.status ?? "unknown",
      });
    }

    return {
      sheetName: "Live Snapshot",
      headers: ["metric", "value"],
      rows,
    };
  }

  // Default: reports metrics
  const { data: metrics } = await supabase
    .from("event_metrics_snapshot")
    .select("*")
    .eq("event_id", eventId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    sheetName: "Report Metrics",
    headers: ["metric", "value"],
    rows: [
      { metric: "Total Plays", value: metrics?.total_plays ?? 0 },
      { metric: "Total Leads", value: metrics?.total_leads ?? 0 },
      { metric: "Total Interactions", value: metrics?.total_interactions ?? 0 },
      { metric: "Total Prizes", value: metrics?.total_prizes ?? 0 },
      { metric: "Avg Dwell Time (s)", value: metrics?.avg_dwell_time ?? 0 },
    ],
  };
}
