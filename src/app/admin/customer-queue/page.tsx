/**
 * AE backstop queue — every customer-side action item that has sat
 * stale for 7+ days. Surfaces the people the system has emailed twice
 * and is now ready to escalate by phone.
 *
 * Pulls from three sources:
 *   - Pending Bright.Blue creative approvals waiting on the customer
 *   - Brief responses that are unsubmitted
 *   - Asset revisions the customer hasn't re-uploaded
 *
 * Listed oldest-first so the AE can pick up the riskiest item first.
 */

import { redirect } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeSince } from "@/lib/dates";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getUnreadCount } from "@/lib/queries/notifications";
import { STUCK_CUSTOMER_DAYS } from "@/lib/queries/admin-queues";

export const metadata = {
  title: "Customer queue · Bright.Experience",
};

const STALE_DAYS = STUCK_CUSTOMER_DAYS;

interface StaleItem {
  id: string;
  kind: "approval" | "briefing" | "asset_revision";
  title: string;
  eventName: string | null;
  accountName: string | null;
  anchor: string;
  link: string;
}

function ageDays(iso: string): number {
  if (!iso) return 0;
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000)
  );
}

export default async function CustomerQueuePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [approvalsRes, briefingsRes, revisionsRes, unread] = await Promise.all([
    supabase
      .from("approvals")
      .select(
        "id, event_id, title, requested_at, events(name, accounts(name))"
      )
      .eq("status", "pending")
      .lt("requested_at", cutoff),
    supabase
      .from("briefing_responses")
      .select(
        "event_id, form_type, updated_at, events(name, accounts(name))"
      )
      .eq("is_submitted", false)
      .lt("updated_at", cutoff),
    supabase
      .from("assets")
      .select(
        "id, event_id, name, review_decided_at, events(name, accounts(name))"
      )
      .eq("review_status", "revision_requested")
      .lt("review_decided_at", cutoff),
    getUnreadCount(user.id),
  ]);

  const items: StaleItem[] = [];

  for (const row of (approvalsRes.data ?? []) as Array<Record<string, unknown>>) {
    const events = row.events as
      | { name?: string; accounts?: { name?: string } }
      | null;
    items.push({
      id: `approval-${row.id}`,
      kind: "approval",
      title: `Approval pending: ${row.title as string}`,
      eventName: events?.name ?? null,
      accountName: events?.accounts?.name ?? null,
      anchor: String(row.requested_at),
      link: `/events/${row.event_id}/approvals`,
    });
  }

  for (const row of (briefingsRes.data ?? []) as Array<Record<string, unknown>>) {
    const events = row.events as
      | { name?: string; accounts?: { name?: string } }
      | null;
    items.push({
      id: `briefing-${row.event_id}-${row.form_type}`,
      kind: "briefing",
      title: `Brief not submitted (${String(row.form_type)})`,
      eventName: events?.name ?? null,
      accountName: events?.accounts?.name ?? null,
      anchor: String(row.updated_at),
      link: `/events/${row.event_id}/briefing`,
    });
  }

  for (const row of (revisionsRes.data ?? []) as Array<Record<string, unknown>>) {
    const events = row.events as
      | { name?: string; accounts?: { name?: string } }
      | null;
    items.push({
      id: `asset-${row.id}`,
      kind: "asset_revision",
      title: `Awaiting re-upload: ${row.name as string}`,
      eventName: events?.name ?? null,
      accountName: events?.accounts?.name ?? null,
      anchor: String(row.review_decided_at),
      link: `/events/${row.event_id}/assets`,
    });
  }

  items.sort((a, b) => a.anchor.localeCompare(b.anchor));

  return (
    <AppShell user={user} isInternal={isInternal} notificationCount={unread}>
      <PageHeader
        eyebrow="Account managers"
        title="Customer queue"
        subtitle={
          items.length === 0
            ? "Nothing has gone stale. Every customer-side item is inside the reminder window."
            : `${items.length} item${items.length === 1 ? "" : "s"} sitting > ${STALE_DAYS} days. Time to pick up the phone — the reminders have already gone out.`
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Queue empty"
          description="When a customer-side action sits longer than 7 days, it'll appear here so you can chase by phone."
          size="lg"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.link}
              className="group block"
            >
              <Card
                tone="subtle"
                className="transition-colors hover:border-white/16"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {item.accountName ? `${item.accountName} · ` : ""}
                      {item.eventName ?? "Account-level"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {ageDays(item.anchor)} days stale
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Since {timeSince(item.anchor)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </AppShell>
  );
}
