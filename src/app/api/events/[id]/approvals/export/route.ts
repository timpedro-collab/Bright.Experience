/**
 * GET /api/events/:id/approvals/export
 *
 * Expected caller: authenticated Bright.Blue staff or a customer admin
 * viewing their own event in the portal (CSV download of the creative
 * approval audit trail).
 *
 * Auth: session cookie via Supabase SSR. Internal roles may export any
 * event; customers are scoped to events belonging to their account_id
 * (mirrors `/api/events/:id/export`).
 *
 * Payload: none (GET). Returns `text/csv` with one row per asset version
 * (upload metadata + review decision + feedback + actor + timestamps),
 * sorted newest-first.
 */

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isInternalRole } from "@/lib/roles";
import { getAssetDecisionLog } from "@/lib/queries/assets";
import { toCsv, csvResponse } from "@/lib/exports/csv";

export const dynamic = "force-dynamic";

const HEADERS = [
  "asset_name",
  "asset_id",
  "version",
  "file_name",
  "uploaded_at",
  "uploader",
  "review_status",
  "review_feedback",
  "reviewer",
  "review_decided_at",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, account_id")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role ?? null;

  let eventQuery = supabase.from("events").select("id, name").eq("id", eventId);
  if (role && !isInternalRole(role) && profile?.account_id) {
    eventQuery = eventQuery.eq("account_id", profile.account_id);
  }
  const { data: eventAccess } = await eventQuery.maybeSingle();
  if (!eventAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await getAssetDecisionLog(eventId);
  const rows = entries.map((e) => ({
    asset_name: e.assetName,
    asset_id: e.assetId,
    version: e.version,
    file_name: e.fileName ?? "",
    uploaded_at: e.uploadedAt,
    uploader: e.uploaderName ?? "",
    review_status: e.reviewStatus,
    review_feedback: e.reviewFeedback ?? "",
    reviewer: e.reviewerName ?? "",
    review_decided_at: e.reviewDecidedAt ?? "",
  }));

  const eventName = String(eventAccess.name).replace(/[^a-zA-Z0-9-_ ]/g, "");
  const timestamp = new Date().toISOString().slice(0, 10);
  const csv = toCsv(rows, { headers: [...HEADERS] });
  return csvResponse(csv, `${eventName}-approvals-${timestamp}.csv`);
}
