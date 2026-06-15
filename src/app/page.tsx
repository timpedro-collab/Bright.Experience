/**
 * The Bright.Experience home — every authenticated user lands here.
 *
 * Two distinct surfaces, one chrome:
 *
 *   - Customer (most users): an editorial spread for the featured
 *     event. Full-bleed ridge artwork hero, three editorial columns
 *     ("Waiting on you" · "The Chapters" · "From your team"), and
 *     a small rail of other editions if the customer has more than
 *     one event.
 *
 *   - Internal (Bright.Blue employees): "Your library." — a grid of
 *     every active edition rendered as `<EditionPlate>` cards, each
 *     carrying its own unique ridge fingerprint.
 *
 * Both modes share `<EditionShell>` as their outer chrome, which
 * gives us the brand mark, breadcrumbs, theme-awareness, command
 * palette, hairlines, and footer band without per-page boilerplate.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  CircleCheck,
  TriangleAlert,
  ListChecks,
  CalendarClock,
  GitBranch,
  Users,
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
  RidgeHero,
  EditorialEyebrow,
  Hairline,
  type PlateStatusTone,
} from "@/components/brand";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { CommandPalette } from "@/components/layout/CommandPalette";

import { getEvents, getEventsPaginated, type EventFilters } from "@/lib/queries/events";
import { EventFilterBar } from "@/components/events/EventFilterBar";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getOpenTaskCountsForUser, getTasksByRole, getTaskProgressByEvent } from "@/lib/queries/tasks";
import { MyWorkDashboard } from "@/components/dashboard/MyWorkDashboard";
import { getTeamForEvent } from "@/lib/queries/team";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { parsePage } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import { TourShell } from "@/components/onboarding/TourShell";
import { StreakIndicator } from "@/components/dashboard/StreakIndicator";
import { CustomerActionSummary } from "@/components/events/CustomerActionSummary";
import { getStreak } from "@/app/actions/streak";
import { getCustomerActionItems } from "@/lib/queries/deadlines";
import { getPendingQuotesForCustomer } from "@/lib/queries/quotes";
import { CustomerHoldingState } from "@/components/home/CustomerHoldingState";
import { STAGE_CONFIG } from "@/types";
import type { Event, EventTeamMember, Stage } from "@/types";

/**
 * Pick the event the customer most wants to see first. We prefer:
 *   1) anything currently blocked (red)
 *   2) the closest upcoming event still in delivery
 *   3) the most recently active event we have
 */
function pickFeaturedEvent(events: Event[]): Event | null {
  if (events.length === 0) return null;
  const blocked = events.find((e) => e.healthStatus === "red");
  if (blocked) return blocked;
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.eventDateStart).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDateStart).getTime() -
        new Date(b.eventDateStart).getTime(),
    )[0];
  return upcoming ?? events[0];
}

/**
 * Render-safe time-until phrase. Returns `"26 days · 06 hours"` style
 * strings, or `"Live now"` if we're between start and end, or
 * `"Wrapped"` if the event is already over.
 */
function timeUntil(event: Event): string {
  const start = new Date(event.eventDateStart).getTime();
  const end = new Date(event.eventDateEnd ?? event.eventDateStart).getTime();
  const now = Date.now();
  if (now >= start && now <= end) return "Live now";
  if (now > end) return "Wrapped";
  const diffMs = start - now;
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  return `${days}d · ${String(hours).padStart(2, "0")}h`;
}

/**
 * Map an event's health into a tone for the on-track pill.
 */
function healthLabel(event: Event): {
  label: string;
  tone: PlateStatusTone;
} {
  if (event.healthStatus === "red")
    return { label: "Blocked", tone: "warning" };
  if (event.healthStatus === "amber")
    return { label: "At risk", tone: "warning" };
  if (event.currentStage === "event_live")
    return { label: "Live", tone: "live" };
  if (event.currentStage === "complete" || event.currentStage === "reporting")
    return { label: "Wrap", tone: "wrap" };
  return { label: "On track", tone: "active" };
}

/**
 * Sequence of operational stages in the order they happen, used by the
 * Progress column to show the customer where they are and what's next.
 */
const STAGE_ORDER: Stage[] = [
  "confirmed",
  "kickoff_complete",
  "creative_assets",
  "approvals",
  "build_configuration",
  "qa_readiness",
  "logistics_confirmed",
  "event_live",
  "reporting",
  "complete",
];

/** Compact axis labels for the portfolio-by-stage chart. */
const STAGE_SHORT: Record<Stage, string> = {
  confirmed: "Confirmed",
  kickoff_complete: "Kickoff",
  creative_assets: "Assets",
  approvals: "Approvals",
  build_configuration: "Build",
  qa_readiness: "QA",
  logistics_confirmed: "Logistics",
  event_live: "Live",
  reporting: "Reporting",
  complete: "Complete",
};

/**
 * Return the current stage plus the next two upcoming stages. We
 * deliberately limit to three rows so the column has the same calm
 * editorial density as the "Waiting on you" and "From your team"
 * columns — no chapter narrative, no Roman numerals, just the next
 * few real operational stages.
 */
function getProgressRows(event: Event): Array<{
  id: Stage;
  label: string;
  status: "in progress" | "up next" | "complete";
  active: boolean;
}> {
  const currentIdx = STAGE_ORDER.indexOf(event.currentStage as Stage);
  if (currentIdx === -1) return [];
  return STAGE_ORDER.slice(currentIdx, currentIdx + 3).map((stage, i) => ({
    id: stage,
    label: STAGE_CONFIG[stage]?.label ?? stage,
    status: i === 0 ? "in progress" : "up next",
    active: i === 0,
  }));
}

/** The "From your team" column — account manager + real team members. */
function TeamColumn({
  eventId,
  members,
  hideEyebrow = false,
}: {
  eventId: string;
  members: EventTeamMember[];
  hideEyebrow?: boolean;
}) {
  const am = {
    initial: DEFAULT_ACCOUNT_MANAGER.firstName[0],
    name: DEFAULT_ACCOUNT_MANAGER.fullName,
    title: DEFAULT_ACCOUNT_MANAGER.title,
  };
  const approvedMembers = members
    .filter((m) => m.status === "approved")
    .slice(0, 4)
    .map((m) => ({
      initial: (m.profile?.name?.[0] ?? m.email[0]).toUpperCase(),
      name: m.profile?.name ?? m.email,
      title: m.roleLabel,
    }));
  const team = [am, ...approvedMembers];

  return (
    <div className="space-y-4">
      {!hideEyebrow && <EditorialEyebrow accent>From your team</EditorialEyebrow>}
      {team.length === 1 && approvedMembers.length === 0 ? (
        <>
          <TeamMemberRow member={am} />
          <p className="text-sm text-muted-foreground">
            No team members yet.
          </p>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {team.map((m) => (
            <TeamMemberRow key={m.name} member={m} />
          ))}
        </ul>
      )}
      <Link
        href={`/events/${eventId}/communications`}
        className="inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
      >
        Message your team →
      </Link>
    </div>
  );
}

function TeamMemberRow({
  member,
}: {
  member: { initial: string; name: string; title: string };
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex items-center justify-center size-8 rounded-full bg-card border border-border text-overline text-foreground">
        {member.initial}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">
          {member.name}
        </span>
        <span className="text-overline text-muted-foreground">
          {member.title}
        </span>
      </span>
    </li>
  );
}

/** Friendly first-name greeting. */
function firstName(name?: string): string {
  if (!name) return "there";
  return name.split(" ")[0] ?? name;
}

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getUser();
  if (!user) {
    const { PublicLanding } = await import("@/components/public/PublicLanding");
    return <PublicLanding />;
  }
  if (!user.hasCompletedOnboarding) redirect("/welcome");

  const params = await searchParams;
  const isInternal = isInternalRole(user.role);
  const page = parsePage(params);

  const filters: EventFilters = {
    q: typeof params.q === "string" ? params.q : undefined,
    stage: typeof params.stage === "string" ? params.stage : undefined,
    health: typeof params.health === "string" ? params.health : undefined,
    owner: typeof params.owner === "string" ? params.owner : undefined,
  };

  const [eventsResult, unread, roleTaskGroups, streak] = await Promise.all([
    isInternal ? getEventsPaginated(page, undefined, filters) : getEventsPaginated(page),
    getUnreadCount(user.id),
    isInternal ? getTasksByRole(user.role, user.id) : Promise.resolve([]),
    getStreak(),
  ]);
  const events = eventsResult.data;

  const featured = pickFeaturedEvent(events);
  const others = featured ? events.filter((e) => e.id !== featured.id) : [];

  // Featured-event-specific data only fetched if there's something to feature.
  const eventIds = events.map((e) => e.id);
  const [taskCounts, featuredTeam, taskProgress, customerActions] = await Promise.all([
    getOpenTaskCountsForUser(user.id, isInternal, eventIds),
    featured ? getTeamForEvent(featured.id) : Promise.resolve([]),
    getTaskProgressByEvent(eventIds),
    featured && !isInternal ? getCustomerActionItems(featured.id) : Promise.resolve([]),
  ]);

  // Internal mode → Library with role-aware work dashboard
  if (isInternal) {
    const onTrackCount = events.filter((e) => e.healthStatus === "green").length;
    const atRiskCount = events.filter(
      (e) => e.healthStatus === "amber" || e.healthStatus === "red",
    ).length;
    const openForMe = Object.values(taskCounts).reduce(
      (sum, n) => sum + (n ?? 0),
      0,
    );

    // Portfolio-by-stage uses the full event set (not the paginated page)
    // so the chart reflects the whole pipeline at a glance. Fall back to
    // the already-loaded page if the full fetch comes back empty.
    const fullEvents = await getEvents();
    const portfolioEvents = fullEvents.length > 0 ? fullEvents : events;
    const stageData = STAGE_ORDER.map((stage) => ({
      name: STAGE_SHORT[stage],
      count: portfolioEvents.filter((e) => e.currentStage === stage).length,
    }));

    return (
      <TourShell role={user.role} autoStart={false}>
      <EditionShell theme="dark">
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
              events.length === 0
                ? "No events in production yet. Create the first one to get started."
                : `${events.length} event${events.length === 1 ? "" : "s"} in production · ${onTrackCount} on track.`
            }
            actions={<StreakIndicator streak={streak} />}
          />

          <KpiGrid>
            <KpiCard label="Total events" value={events.length} icon={Layers} />
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
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--bb-shadow-premium)] hover:brightness-110"
              >
                New edition <ArrowRight className="size-4" />
              </Link>
            </div>
            <EventFilterBar
              owners={[...new Set(events.map((e) => e.account.name).filter(Boolean))]}
              currentFilters={filters}
            />
            {events.length === 0 ? (
              <div className="flex flex-col items-start gap-4 py-8">
                <p className="text-muted-foreground">
                  No events match your filters. Try adjusting or clearing them.
                </p>
              </div>
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
                {typeof eventsResult?.totalPages === "number" && eventsResult.totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={eventsResult.totalPages}
                    basePath="/"
                  />
                )}
              </>
            )}
          </section>
        </div>
        <EditionFooter
          rightSlot={
            <Link
              href="/inbox"
              className="hover:opacity-80 transition-opacity"
            >
              Open the queue →
            </Link>
          }
        />
        <CommandPalette isInternal />
      </EditionShell>
      </TourShell>
    );
  }

  // A logged-in customer with no event isn't dumped to the public funnel —
  // we show their in-flight proposal (if any) or a warm in-portal discovery.
  const pendingQuotes = !featured
    ? await getPendingQuotesForCustomer(user.email)
    : [];

  // Customer mode → Featured event editorial spread
  return (
    <TourShell role={user.role} autoStart={false}>
    <EditionShell theme="dark">
      <EditionChrome
        breadcrumbs={
          featured
            ? [{ label: featured.name, href: `/events/${featured.id}` }]
            : [{ label: "Home" }]
        }
        rightSlot={
          <>
            <NotificationBell unreadCount={unread} />
            <span className="hidden md:block h-6 w-px bg-border" aria-hidden />
            <UserMenu user={user} />
          </>
        }
      />

      {!featured ? (
        <CustomerHoldingState
          firstName={firstName(user.name)}
          pendingQuotes={pendingQuotes}
        />
      ) : (
        <>
          <RidgeHero
            variant="compact"
            seed={featured.id}
            eyebrow={`Welcome back, ${firstName(user.name)}`}
            title={`${featured.name} is taking shape.`}
            subtitle={(() => {
              const stageLabel =
                STAGE_CONFIG[featured.currentStage as Stage]?.label ??
                featured.currentStage;
              const t = timeUntil(featured);
              if (t === "Live now") return `Live now at ${featured.venueName ?? "your venue"}.`;
              if (t === "Wrapped") return `Wrapped. Reports are landing in your inbox.`;
              return `Currently at ${stageLabel}. Event in ${t}.`;
            })()}
            rightSlot={
              <>
                <StreakIndicator streak={streak} />
                <span className="flex items-center gap-2">
                  <span
                    className={
                      healthLabel(featured).tone === "active"
                        ? "size-1.5 rounded-full bg-[var(--color-bb-cyan)]"
                        : "size-1.5 rounded-full bg-[hsl(43_90%_56%)]"
                    }
                    aria-hidden
                  />
                  {healthLabel(featured).label}
                </span>
              </>
            }
          />

          <div className="space-y-8 py-6" data-tour="featured-event">
            <KpiGrid>
              <KpiCard
                label="Time to event"
                value={timeUntil(featured)}
                icon={CalendarClock}
                hint={featured.venueName ?? undefined}
              />
              <KpiCard
                label="Needs you"
                value={customerActions.length}
                icon={ListChecks}
                hint={customerActions.length === 0 ? "all clear" : "open items"}
              />
              <KpiCard
                label="Stage"
                value={`${(STAGE_CONFIG[featured.currentStage as Stage]?.order ?? 0) + 1}/10`}
                icon={GitBranch}
                hint={
                  STAGE_CONFIG[featured.currentStage as Stage]?.label ??
                  featured.currentStage
                }
              />
              <KpiCard
                label="Your team"
                value={featuredTeam.filter((m) => m.status === "approved").length + 1}
                icon={Users}
                hint="on this event"
              />
            </KpiGrid>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard data-tour="waiting-on-you">
                <GlassCardHeader title="What's needed from you" />
                <div className="p-6">
                  <CustomerActionSummary eventId={featured.id} items={customerActions} />
                </div>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader title="Progress" />
                <div className="p-6 space-y-4">
                  {(() => {
                    const rows = getProgressRows(featured);
                    if (rows.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          This event is wrapped. Final reports will be in
                          your inbox shortly.
                        </p>
                      );
                    }
                    return (
                      <ul className="flex flex-col">
                        {rows.map((row) => (
                          <li
                            key={row.id}
                            className="flex items-start justify-between gap-3 border-b border-border/40 py-3 last:border-0"
                          >
                            <span
                              className={
                                row.active
                                  ? "text-sm text-foreground font-medium leading-snug"
                                  : "text-sm text-muted-foreground leading-snug"
                              }
                            >
                              {row.label}
                            </span>
                            <span
                              className={
                                row.active
                                  ? "text-overline text-[var(--color-bb-cobalt)] whitespace-nowrap"
                                  : "text-overline text-muted-foreground whitespace-nowrap"
                              }
                            >
                              {row.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                  <Link
                    href={`/events/${featured.id}/timeline`}
                    className="inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
                  >
                    Open the full timeline →
                  </Link>
                </div>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader title="From your team" />
                <div className="p-6">
                  <TeamColumn eventId={featured.id} members={featuredTeam} hideEyebrow />
                </div>
              </GlassCard>
            </div>
          </div>

          {others.length > 0 && (
            <section className="py-10">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Your other events
                </h2>
                <Link
                  href="/"
                  className="text-overline text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {others.slice(0, 6).map((event) => {
                  const health = healthLabel(event);
                  return (
                    <EditionPlate
                      key={event.id}
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
                  );
                })}
              </div>
              {typeof eventsResult?.totalPages === "number" && eventsResult.totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={eventsResult.totalPages}
                  basePath="/"
                />
              )}
              <Hairline className="opacity-60 mt-10" />
            </section>
          )}
        </>
      )}

      <EditionFooter
        rightSlot={
          featured ? (
            <Link
              href={`/events/${featured.id}`}
              className="hover:opacity-80 transition-opacity"
            >
              Open this event →
            </Link>
          ) : null
        }
      />
      <CommandPalette />
    </EditionShell>
    </TourShell>
  );
}
