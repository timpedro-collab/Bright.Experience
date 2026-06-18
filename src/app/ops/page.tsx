/**
 * Ops command center — the single internal cockpit.
 *
 * Pulls together the three things an orchestrator checks first thing: the
 * portfolio health (KPIs + by-stage), the live work queues, and the events
 * that need a human right now. Everything here is read-aggregate; the deep
 * surfaces (pipeline, inbox, reviews) are one click away.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  CircleCheck,
  TriangleAlert,
  Radio,
  ArrowRight,
} from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { AutoRefresh } from "@/components/system/AutoRefresh";
import {
  KpiGrid,
  KpiCard,
  GlassCard,
  GlassCardHeader,
  ChartCard,
  CloudBarChart,
} from "@/components/cloud";
import { InternalWorkQueue } from "@/components/admin/InternalWorkQueue";
import { HealthBadge, StageBadge } from "@/components/ui/StatusBadge";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getEventPortfolioStats } from "@/lib/queries/portfolio";
import { getInternalQueueCounts } from "@/lib/queries/admin-queues";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatDateMedium } from "@/lib/dates";

export default async function OpsCommandCenterPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const [portfolio, queues, unread] = await Promise.all([
    getEventPortfolioStats(),
    getInternalQueueCounts(),
    getUnreadCount(user.id),
  ]);

  // Events that need a human now — blocked first, then at-risk — newest soonest.
  const needsAttention = portfolio.events
    .filter((e) => e.healthStatus === "red" || e.healthStatus === "amber")
    .sort((a, b) => {
      if (a.healthStatus !== b.healthStatus) {
        return a.healthStatus === "red" ? -1 : 1;
      }
      return (
        new Date(a.eventDateStart).getTime() -
        new Date(b.eventDateStart).getTime()
      );
    })
    .slice(0, 8);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Command center"
      title="Command center."
      subtitle={`${portfolio.total} events in flight · ${portfolio.onTrack} on track · ${portfolio.blocked} blocked.`}
    >
      <AutoRefresh />
      <div className="space-y-8 py-8">
        <KpiGrid>
          <KpiCard label="In flight" value={portfolio.total} icon={Layers} />
          <KpiCard
            label="On track"
            value={portfolio.onTrack}
            icon={CircleCheck}
            hint="healthy"
          />
          <KpiCard
            label="At risk / blocked"
            value={portfolio.atRisk}
            icon={TriangleAlert}
            hint={portfolio.atRisk > 0 ? "needs attention" : undefined}
          />
          <KpiCard
            label="Live now"
            value={portfolio.live}
            icon={Radio}
            hint={portfolio.live > 0 ? "on the floor" : undefined}
          />
        </KpiGrid>

        <InternalWorkQueue queues={queues} viewerRole={user.role} />

        {portfolio.total > 0 && (
          <ChartCard
            title="Portfolio by stage"
            description={`Where ${portfolio.total} event${portfolio.total === 1 ? "" : "s"} sit in the delivery pipeline`}
            height={260}
          >
            <CloudBarChart
              data={portfolio.stageData}
              xKey="name"
              series={[{ key: "count", name: "Events", tone: "primary" }]}
            />
          </ChartCard>
        )}

        <GlassCard>
          <GlassCardHeader
            title="Needs attention"
            description="Blocked and at-risk events, most urgent first"
            action={
              <Link
                href="/pipeline"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
              >
                Open pipeline <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="p-6">
            {needsAttention.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Everything is on track. Nothing needs a hand right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {needsAttention.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.id}`}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {event.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {event.account.name} · {formatDateMedium(event.eventDateStart)}
                        </span>
                      </span>
                      <StageBadge stage={event.currentStage} />
                      <HealthBadge status={event.healthStatus} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>
      </div>
    </AdminPageShell>
  );
}
