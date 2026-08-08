/**
 * Loop-pulse reads — the raw counts behind /admin/loop-pulse.
 *
 * One function, one dashboard: accepted→provisioned time, report
 * published→viewed rate, rebook rate, invitation landings by artifact,
 * machine email-capture rate, and the "how did you hear about us"
 * distribution. Runs under the internal viewer's session (RLS gives
 * internal roles read access to every table touched here).
 *
 * Queries run sequentially and each list read is bounded with `.limit()` —
 * these are aggregate scans over small operational tables, not unbounded
 * exports.
 */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  buildInvitationRows,
  medianDurationHours,
  ratePct,
  type InvitationRow,
} from "@/lib/loop-pulse";

export interface LoopPulseData {
  provisioning: {
    /** Median hours from quote acceptance to workspace creation. */
    medianHours: number | null;
    /** Accepted quotes that produced a workspace. */
    provisionedCount: number;
    /** Accepted quotes still waiting for a workspace — should be zero. */
    unprovisionedCount: number;
  };
  reports: {
    publishedCount: number;
    /** Distinct events whose public report link has been opened. */
    viewedEventCount: number;
    viewRatePct: number | null;
  };
  rebook: {
    /** Accounts with at least one completed event. */
    accountsWithCompleted: number;
    /** Of those, accounts that booked more than one event. */
    accountsRebooked: number;
    ratePct: number | null;
    /** Quotes created through the one-click rebook path. */
    rebookQuoteCount: number;
  };
  invitations: InvitationRow[];
  capture: {
    totalPlays: number;
    totalLeads: number;
    ratePct: number | null;
  };
  referrals: Array<{ source: string; count: number }>;
}

/** Fetch every loop-pulse metric. Individual failures degrade to empty data. */
export async function getLoopPulse(): Promise<LoopPulseData> {
  const supabase = await createClient();

  // 1. Accepted quotes and their provisioned workspaces.
  const { data: acceptedQuotes, error: acceptedErr } = await supabase
    .from("quotes")
    .select("accepted_at, event_id, events(created_at)")
    .eq("status", "accepted")
    .not("accepted_at", "is", null)
    .limit(500);
  if (acceptedErr) {
    logQueryError("getLoopPulse.accepted", acceptedErr);
  }

  // 2. Quotes created via the authenticated rebook path (see
  //    actions/quotes/rebook.ts — it stamps this prefix on every rebook).
  const { count: rebookQuoteCount, error: rebookErr } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .ilike("special_requirements", 'Rebook of "%');
  if (rebookErr) logQueryError("getLoopPulse.rebookQuotes", rebookErr);

  // 3. Self-reported discovery channel.
  const { data: referralRows, error: referralErr } = await supabase
    .from("quotes")
    .select("referral_source")
    .not("referral_source", "is", null)
    .limit(2000);
  if (referralErr) logQueryError("getLoopPulse.referrals", referralErr);

  // 4. Published reports.
  const { count: publishedCount, error: publishedErr } = await supabase
    .from("event_reports")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);
  if (publishedErr) logQueryError("getLoopPulse.published", publishedErr);

  // 5–7. Loop telemetry: report opens, invitation landings, player cards.
  const { data: reportViewRows, error: rvErr } = await supabase
    .from("loop_events")
    .select("event_id")
    .eq("kind", "report_view")
    .limit(5000);
  if (rvErr) logQueryError("getLoopPulse.reportViews", rvErr);

  const { data: landingRows, error: landingErr } = await supabase
    .from("loop_events")
    .select("artifact")
    .eq("kind", "invitation_landing")
    .limit(5000);
  if (landingErr) logQueryError("getLoopPulse.landings", landingErr);

  const { count: playerCardViews, error: pcErr } = await supabase
    .from("loop_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", "player_card_view");
  if (pcErr) logQueryError("getLoopPulse.playerCards", pcErr);

  // 8. Rebook base: every event's account + stage.
  const { data: eventRows, error: eventsErr } = await supabase
    .from("events")
    .select("account_id, stage")
    .limit(2000);
  if (eventsErr) logQueryError("getLoopPulse.events", eventsErr);

  // 9. Fleet-wide capture rate.
  const { data: snapshotRows, error: snapErr } = await supabase
    .from("event_metrics_snapshot")
    .select("total_plays, total_leads")
    .limit(5000);
  if (snapErr) logQueryError("getLoopPulse.snapshots", snapErr);

  // --- Provisioning ---
  // The `events` embed is typed as an array by supabase-js even though the
  // FK is to-one; normalise both shapes.
  const accepted = ((acceptedQuotes ?? []) as unknown[]).map((row) => {
    const q = row as {
      accepted_at: string;
      event_id: string | null;
      events:
        | { created_at: string }
        | Array<{ created_at: string }>
        | null;
    };
    const event = Array.isArray(q.events) ? (q.events[0] ?? null) : q.events;
    return { acceptedAt: q.accepted_at, eventId: q.event_id, event };
  });
  const durations = accepted
    .filter((q) => q.eventId && q.event?.created_at)
    .map(
      (q) =>
        new Date(q.event!.created_at).getTime() -
        new Date(q.acceptedAt).getTime(),
    );
  const provisionedCount = accepted.filter((q) => q.eventId).length;
  const unprovisionedCount = accepted.length - provisionedCount;

  // --- Reports ---
  const viewedEventIds = new Set(
    ((reportViewRows ?? []) as Array<{ event_id: string | null }>)
      .map((r) => r.event_id)
      .filter((id): id is string => Boolean(id)),
  );
  const published = publishedCount ?? 0;
  // Views of since-unpublished reports could push the count past the
  // published total; the rate is capped so it never reads over 100%.
  const viewedEventCount = Math.min(viewedEventIds.size, published);

  // --- Rebook ---
  const perAccount = new Map<string, { total: number; completed: boolean }>();
  for (const row of (eventRows ?? []) as Array<{
    account_id: string | null;
    stage: string;
  }>) {
    if (!row.account_id) continue;
    const entry = perAccount.get(row.account_id) ?? {
      total: 0,
      completed: false,
    };
    entry.total += 1;
    if (row.stage === "complete") entry.completed = true;
    perAccount.set(row.account_id, entry);
  }
  const completedAccounts = [...perAccount.values()].filter((a) => a.completed);
  const rebookedAccounts = completedAccounts.filter((a) => a.total > 1);

  // --- Invitations ---
  const landingsByArtifact: Record<string, number> = {};
  for (const row of (landingRows ?? []) as Array<{ artifact: string | null }>) {
    const key = row.artifact ?? "unknown";
    landingsByArtifact[key] = (landingsByArtifact[key] ?? 0) + 1;
  }
  const viewsByArtifact: Record<string, number> = {
    report: (reportViewRows ?? []).length,
    player_card: playerCardViews ?? 0,
  };

  // --- Capture ---
  let totalPlays = 0;
  let totalLeads = 0;
  for (const row of (snapshotRows ?? []) as Array<{
    total_plays: number | null;
    total_leads: number | null;
  }>) {
    totalPlays += row.total_plays ?? 0;
    totalLeads += row.total_leads ?? 0;
  }

  // --- Referrals ---
  const referralCounts = new Map<string, number>();
  for (const row of (referralRows ?? []) as Array<{
    referral_source: string | null;
  }>) {
    const source = row.referral_source?.trim();
    if (!source) continue;
    referralCounts.set(source, (referralCounts.get(source) ?? 0) + 1);
  }

  return {
    provisioning: {
      medianHours: medianDurationHours(durations),
      provisionedCount,
      unprovisionedCount,
    },
    reports: {
      publishedCount: published,
      viewedEventCount,
      viewRatePct: ratePct(viewedEventCount, published),
    },
    rebook: {
      accountsWithCompleted: completedAccounts.length,
      accountsRebooked: rebookedAccounts.length,
      ratePct: ratePct(rebookedAccounts.length, completedAccounts.length),
      rebookQuoteCount: rebookQuoteCount ?? 0,
    },
    invitations: buildInvitationRows(landingsByArtifact, viewsByArtifact),
    capture: {
      totalPlays,
      totalLeads,
      ratePct: ratePct(totalLeads, totalPlays),
    },
    referrals: [...referralCounts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  };
}
