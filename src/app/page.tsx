/** Authenticated dashboard — events grid with next-step hero & tappable KPIs */
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Sparkles, Compass } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NextStepCard } from "@/components/layout/NextStepCard";
import { EventCard } from "@/components/events/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { HeroMetric, HeroMetricSatellite } from "@/components/ui/hero-metric";
import { InternalWorkQueue } from "@/components/admin/InternalWorkQueue";
import { MyTasksPanel } from "@/components/admin/MyTasksPanel";

import { getEvents } from "@/lib/queries/events";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getInternalQueueCounts } from "@/lib/queries/admin-queues";
import {
  getOpenTaskCountsForUser,
  getTasksAssignedToUser,
} from "@/lib/queries/tasks";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { STAGE_CONFIG } from "@/types";
import type { HealthStatus, Stage, Event } from "@/types";

function getStats(events: Event[]) {
  const total = events.length;
  const byHealth: Record<HealthStatus, number> = { green: 0, amber: 0, red: 0 };
  events.forEach((e) => byHealth[e.healthStatus]++);
  const activeStages = new Set(events.map((e) => e.currentStage));

  const upcoming = events
    .filter((e) => new Date(e.eventDateStart) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.eventDateStart).getTime() -
        new Date(b.eventDateStart).getTime()
    );
  const liveOrSoon = events.filter(
    (e) => e.currentStage === "event_live" || e.healthStatus === "red"
  );

  return { total, byHealth, activeStages, upcoming, liveOrSoon };
}

function pickNextStep(events: Event[]): {
  title: string;
  description: string;
  href: string;
  tone: "brand" | "warning" | "success";
} | null {
  if (events.length === 0) return null;

  // Priority 1 — anything blocked
  const blocked = events.find((e) => e.healthStatus === "red");
  if (blocked) {
    return {
      title: `${blocked.name} needs attention`,
      description: `This event is flagged as blocked at the "${STAGE_CONFIG[blocked.currentStage]?.label ?? blocked.currentStage}" stage. Resolve outstanding actions to unblock delivery.`,
      href: `/events/${blocked.id}`,
      tone: "warning",
    };
  }

  // Priority 2 — closest upcoming event in early stage
  const stageOrder: Stage[] = [
    "confirmed",
    "kickoff_complete",
    "creative_assets",
    "approvals",
    "build_configuration",
    "qa_readiness",
    "logistics_confirmed",
    "event_live",
  ];
  const upcoming = events
    .filter(
      (e) =>
        stageOrder.includes(e.currentStage) &&
        new Date(e.eventDateStart) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.eventDateStart).getTime() -
        new Date(b.eventDateStart).getTime()
    )[0];

  if (upcoming) {
    return {
      title: `${upcoming.name} is your next event`,
      description: `Currently at "${STAGE_CONFIG[upcoming.currentStage]?.label ?? upcoming.currentStage}". Open the workspace to keep delivery on track.`,
      href: `/events/${upcoming.id}`,
      tone: "brand",
    };
  }

  // Priority 3 — most recently active event
  const recent = events[0];
  return {
    title: `Pick up where you left off`,
    description: `Open ${recent.name} to review delivery status, assets, and reports.`,
    href: `/events/${recent.id}`,
    tone: "success",
  };
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const isInternal = isInternalRole(user.role);
  const [events, unread, queueCounts, myTasks] = await Promise.all([
    getEvents(),
    getUnreadCount(user.id),
    isInternal ? getInternalQueueCounts() : Promise.resolve(null),
    isInternal ? getTasksAssignedToUser(user.id) : Promise.resolve([]),
  ]);
  const stats = getStats(events);
  const nextStep = pickNextStep(events);
  // Build the per-event "actions on you" map in a single round-trip so each
  // card can show its pill without a query-per-card fan-out.
  const actionCounts = await getOpenTaskCountsForUser(
    user.id,
    isInternal,
    events.map((e) => e.id)
  );

  return (
    <AppShell isInternal={isInternal} user={user} notificationCount={unread}>
      <PageHeader
        eyebrow={isInternal ? "Internal dashboard" : "Your portal"}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle={
          stats.total === 0
            ? "You don't have any events yet. Get started by browsing the catalog or speaking to your account manager."
            : `${stats.total} event${stats.total === 1 ? "" : "s"} across ${stats.activeStages.size} active stage${stats.activeStages.size === 1 ? "" : "s"}.`
        }
        actions={
          isInternal ? (
            <>
              <Button asChild variant="glass">
                <Link href="/catalog">
                  <Compass className="h-4 w-4" /> Catalog
                </Link>
              </Button>
              <Button asChild variant="brand">
                <Link href="/events/new">
                  <CalendarPlus className="h-4 w-4" /> New event
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="brand">
              <Link href="/quiz">
                <Sparkles className="h-4 w-4" /> Find a fit
              </Link>
            </Button>
          )
        }
      />

      {nextStep && (
        <div className="mb-8">
          <NextStepCard
            title={nextStep.title}
            description={nextStep.description}
            primaryAction={{ label: "Open event", href: nextStep.href }}
            tone={nextStep.tone}
            secondaryAction={{ label: "View all events", href: "#events" }}
          />
        </div>
      )}

      {isInternal && queueCounts && (
        <div className="mb-6">
          <InternalWorkQueue queues={queueCounts} />
        </div>
      )}

      {isInternal && (
        <div className="mb-8">
          <MyTasksPanel tasks={myTasks} totalCount={myTasks.length} />
        </div>
      )}

      {events.length > 0 && (
        <div className="mb-8">
          <HeroMetric
            label="On track"
            value={stats.byHealth.green}
            unit={`/ ${stats.total}`}
            tone="success"
            hint={
              stats.byHealth.red > 0
                ? `${stats.byHealth.red} event${stats.byHealth.red === 1 ? "" : "s"} blocked — resolve to keep delivery moving.`
                : "All events are healthy."
            }
            satellites={
              <>
                <HeroMetricSatellite
                  label="At risk"
                  value={stats.byHealth.amber}
                  tone={stats.byHealth.amber > 0 ? "warning" : "default"}
                />
                <HeroMetricSatellite
                  label="Blocked"
                  value={stats.byHealth.red}
                  tone={stats.byHealth.red > 0 ? "destructive" : "default"}
                />
                <HeroMetricSatellite
                  label="Active stages"
                  value={stats.activeStages.size}
                />
              </>
            }
          />
        </div>
      )}

      <section id="events" className="scroll-mt-20">
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title={isInternal ? "No events yet" : "No active events"}
            description={
              isInternal
                ? "Get started by importing or creating your first event."
                : "Your upcoming activations will appear here. Explore the catalog to plan your next event."
            }
            action={
              isInternal
                ? { label: "Create new event", href: "/events/new" }
                : { label: "Browse catalog", href: "/catalog" }
            }
            secondaryAction={
              isInternal ? { label: "Explore catalog", href: "/catalog" } : undefined
            }
            size="lg"
          />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-heading text-lg font-semibold text-foreground">
                {isInternal ? "All events" : "Your events"}
              </h2>
              <span className="text-overline text-muted-foreground">
                Sorted by risk &amp; recency
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {events
                .slice()
                .sort((a, b) => {
                  const healthOrder: Record<HealthStatus, number> = { red: 0, amber: 1, green: 2 };
                  if (healthOrder[a.healthStatus] !== healthOrder[b.healthStatus]) {
                    return healthOrder[a.healthStatus] - healthOrder[b.healthStatus];
                  }
                  const stageA = STAGE_CONFIG[a.currentStage as Stage];
                  const stageB = STAGE_CONFIG[b.currentStage as Stage];
                  return (stageB?.order ?? 0) - (stageA?.order ?? 0);
                })
                .map((event, i) => (
                  <div
                    key={event.id}
                    className="stagger-item"
                    style={{ "--stagger-index": i } as React.CSSProperties}
                  >
                    <EventCard
                      event={event}
                      isInternal={isInternal}
                      actionsForViewer={actionCounts[event.id] ?? 0}
                    />
                  </div>
                ))}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
