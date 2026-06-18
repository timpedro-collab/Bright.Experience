/**
 * The internal "Your library." home surface for Bright.Blue employees —
 * portfolio KPIs, the by-stage chart, a role-aware work dashboard, and the
 * grid/table of every active edition. Pure presentation: all data is fetched
 * by the home page server component and passed in as serializable props.
 */
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  CircleCheck,
  TriangleAlert,
  ListChecks,
} from "lucide-react";

import {
  PageHeader,
  KpiGrid,
  KpiCard,
  GlassCard,
  GlassCardHeader,
  ChartCard,
  CloudBarChart,
} from "@/components/cloud";
import {
  EditionShell,
  EditionChrome,
  EditionFooter,
  EditionPlate,
} from "@/components/brand";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { InternalWorkQueue } from "@/components/admin/InternalWorkQueue";
import { LibraryViewToggle } from "@/components/events/LibraryViewToggle";
import { EventsLibraryTable } from "@/components/events/EventsLibraryTable";
import { EventFilterBar } from "@/components/events/EventFilterBar";
import { MyWorkDashboard } from "@/components/dashboard/MyWorkDashboard";
import { StreakIndicator } from "@/components/dashboard/StreakIndicator";
import { TourShell } from "@/components/onboarding/TourShell";
import { Pagination } from "@/components/ui/Pagination";

import { healthLabel } from "@/components/home/home-helpers";
import type { getInternalQueueCounts } from "@/lib/queries/admin-queues";
import type { EventFilters } from "@/lib/queries/events";
import type { PortfolioStats } from "@/lib/queries/portfolio";
import type { TaskGroupByEvent } from "@/lib/queries/tasks";
import type { Event, User } from "@/types";

interface InternalDashboardProps {
  user: User;
  unread: number;
  streak: number;
  queueCounts: Awaited<ReturnType<typeof getInternalQueueCounts>> | null;
  roleTaskGroups: TaskGroupByEvent[];
  events: Event[];
  totalPages: number;
  page: number;
  filters: EventFilters;
  taskCounts: Record<string, number>;
  taskProgress: Record<string, { completed: number; total: number }>;
  portfolio: PortfolioStats;
  libraryView: "grid" | "table";
}

export function InternalDashboard({
  user,
  unread,
  streak,
  queueCounts,
  roleTaskGroups,
  events,
  totalPages,
  page,
  filters,
  taskCounts,
  taskProgress,
  portfolio,
  libraryView,
}: InternalDashboardProps) {
  const openForMe = Object.values(taskCounts).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  );

  const onTrackCount = portfolio.onTrack;
  const atRiskCount = portfolio.atRisk;
  const portfolioEvents =
    portfolio.events.length > 0 ? portfolio.events : events;
  const stageData = portfolio.stageData;

  return (
    <TourShell role={user.role} autoStart={false}>
      <EditionShell>
        <EditionChrome
          breadcrumbs={[{ label: "Your library" }]}
          rightSlot={
            <>
              <NotificationBell unreadCount={unread} />
              <span
                className="hidden md:block h-6 w-px bg-border"
                aria-hidden
              />
              <UserMenu user={user} />
            </>
          }
        />
        <div className="space-y-8 py-8 md:py-10">
          <PageHeader
            eyebrow="Your work"
            title="Every event, in one place."
            subtitle={
              portfolio.total === 0
                ? "No events in production yet. Create the first one to get started."
                : `${portfolio.total} event${portfolio.total === 1 ? "" : "s"} in production · ${onTrackCount} on track.`
            }
            actions={<StreakIndicator streak={streak} />}
          />

          {queueCounts && (
            <InternalWorkQueue queues={queueCounts} viewerRole={user.role} />
          )}

          <KpiGrid>
            <KpiCard label="Total events" value={portfolio.total} icon={Layers} />
            <KpiCard
              label="On track"
              value={onTrackCount}
              icon={CircleCheck}
              hint="healthy"
            />
            <KpiCard
              label="At risk / blocked"
              value={atRiskCount}
              icon={TriangleAlert}
              hint={atRiskCount > 0 ? "needs attention" : undefined}
            />
            <KpiCard
              label="Open tasks"
              value={openForMe}
              icon={ListChecks}
              hint="assigned to you"
            />
          </KpiGrid>

          {/* Cloud-grade portfolio chart (real event data) */}
          {portfolioEvents.length > 0 && (
            <ChartCard
              title="Portfolio by stage"
              description={`Where ${portfolioEvents.length} event${portfolioEvents.length === 1 ? "" : "s"} sit in the delivery pipeline`}
              height={260}
            >
              <CloudBarChart
                data={stageData}
                xKey="name"
                series={[{ key: "count", name: "Events", tone: "primary" }]}
              />
            </ChartCard>
          )}

          <GlassCard data-tour="my-work">
            <GlassCardHeader
              title="My work"
              description="Tasks waiting on your role"
              action={
                <Link
                  href="/pipeline"
                  data-tour="pipeline-link"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                >
                  Open pipeline <ArrowRight className="size-4" />
                </Link>
              }
            />
            <div className="p-6">
              <MyWorkDashboard taskGroups={roleTaskGroups} role={user.role} />
            </div>
          </GlassCard>

          <section className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  The library
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Every active edition with its live status.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <LibraryViewToggle view={libraryView} />
                <Link
                  href="/events/new"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--bb-shadow-premium)] hover:brightness-110"
                >
                  New edition <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
            <EventFilterBar
              accounts={[...new Set(portfolioEvents.map((e) => e.account.name).filter(Boolean))]}
              currentFilters={filters}
            />
            {events.length === 0 ? (
              <div className="flex flex-col items-start gap-4 py-8">
                <p className="text-muted-foreground">
                  No events match your filters. Try adjusting or clearing them.
                </p>
              </div>
            ) : libraryView === "table" ? (
              <>
                <EventsLibraryTable
                  rows={events.map((event) => ({
                    id: event.id,
                    name: event.name,
                    accountName: event.account.name,
                    venueName: event.venueName ?? undefined,
                    currentStage: event.currentStage,
                    healthStatus: event.healthStatus,
                    eventDateStart: event.eventDateStart,
                    openTasks: taskCounts[event.id] ?? 0,
                  }))}
                />
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    basePath="/"
                  />
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {events.map((event, i) => {
                    const health = healthLabel(event);
                    return (
                      <div
                        key={event.id}
                        className="stagger-item"
                        style={{ "--stagger-index": i } as React.CSSProperties}
                      >
                        <EditionPlate
                          id={event.id}
                          title={event.name}
                          meta={event.venueName ?? undefined}
                          statusLabel={health.label}
                          statusTone={health.tone}
                          waitingOnYou={(taskCounts[event.id] ?? 0) > 0}
                          completedTasks={taskProgress[event.id]?.completed}
                          totalTasks={taskProgress[event.id]?.total}
                          href={`/events/${event.id}`}
                        />
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    basePath="/"
                  />
                )}
              </>
            )}
          </section>
        </div>
        <EditionFooter
          rightSlot={
            <Link href="/inbox" className="hover:opacity-80 transition-opacity">
              Open the queue →
            </Link>
          }
        />
        <CommandPalette isInternal role={user.role} />
      </EditionShell>
    </TourShell>
  );
}
