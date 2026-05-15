/** Event overview — next-step hero, key stats, milestones, customer actions */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Monitor,
  Package as PackageIcon,
  Share2,
  MessageCircle,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NextStepCard } from "@/components/layout/NextStepCard";
import { HeroMetric, HeroMetricSatellite } from "@/components/ui/hero-metric";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HealthBadge, StageBadge } from "@/components/ui/StatusBadge";
import { StageProgressBar } from "@/components/events/StageProgressBar";
import { MilestoneTimeline } from "@/components/timeline/MilestoneTimeline";
import { TaskChecklist } from "@/components/events/TaskChecklist";
import { EventOwnershipPanel } from "@/components/events/EventOwnershipPanel";

import { getEventById } from "@/lib/queries/events";
import { getMilestonesByEvent } from "@/lib/queries/milestones";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getApprovalsByEvent } from "@/lib/queries/approvals";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { STAGE_CONFIG } from "@/types";
import { formatDateLong, daysUntilDate } from "@/lib/dates";
import { resolveEventNextStep } from "@/lib/event-next-step";

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  const [milestones, tasks, assets, approvals, unread] = await Promise.all([
    getMilestonesByEvent(id),
    getTasksByEvent(id),
    getAssetsByEvent(id),
    getApprovalsByEvent(id),
    getUnreadCount(user.id),
  ]);

  const customerTasks = tasks.filter((t) => t.customerVisible);
  const pendingCustomerTasks = customerTasks.filter(
    (t) => t.status !== "complete" && t.status !== "skipped"
  );
  const completedCount = customerTasks.filter(
    (t) => t.status === "complete"
  ).length;
  const days = daysUntilDate(event.eventDateStart);
  const stageConfig = STAGE_CONFIG[event.currentStage];

  const nextStep = resolveEventNextStep({
    event,
    tasks,
    assets,
    approvals,
    isInternal,
  });

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <PageHeader
        eyebrow={event.account.name}
        title={event.name}
        breadcrumbs={[
          { label: "Events", href: "/" },
          { label: event.name },
        ]}
        meta={
          <>
            <HealthBadge status={event.healthStatus} />
            <StageBadge stage={event.currentStage} />
          </>
        }
        actions={
          <>
            <Button asChild variant="glass" size="sm">
              <Link href={`/events/${id}/communications`}>
                <MessageCircle className="h-4 w-4" /> Messages
              </Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link href={`/events/${id}/timeline`}>
                <Share2 className="h-4 w-4" /> View timeline
              </Link>
            </Button>
          </>
        }
      />

      {nextStep && (
        <div className="mb-6">
          <NextStepCard
            eyebrow={nextStep.eyebrow}
            title={nextStep.title}
            description={nextStep.description}
            primaryAction={nextStep.primaryAction}
            secondaryAction={nextStep.secondaryAction}
            tone={nextStep.tone}
          />
        </div>
      )}

      <div className="mb-6">
        <EventOwnershipPanel
          tasks={tasks}
          viewerRole={user.role}
          ctaHref={`/events/${id}/actions`}
        />
      </div>

      {/* Hero metric — days to event + supporting KPIs */}
      <div className="mb-6">
        <HeroMetric
          label={days > 0 ? "Days to event" : days === 0 ? "Live today" : "Days since event"}
          value={Math.max(0, Math.abs(days))}
          tone={days < 0 ? "default" : days <= 14 ? "warning" : "default"}
          hint={`${stageConfig.label} — Stage ${stageConfig.order + 1} of 10`}
          satellites={
            <>
              <HeroMetricSatellite
                label="Pending actions"
                value={pendingCustomerTasks.length}
                tone={pendingCustomerTasks.length > 0 ? "warning" : "success"}
              />
              <HeroMetricSatellite
                label="Blocking"
                value={tasks.filter((t) => t.isBlocking && t.status !== "complete").length}
                tone={
                  tasks.some((t) => t.isBlocking && t.status !== "complete")
                    ? "destructive"
                    : "success"
                }
              />
              <HeroMetricSatellite
                label="Approvals pending"
                value={approvals.filter((a) => a.status === "pending").length}
                tone={
                  approvals.some((a) => a.status === "pending") ? "warning" : "default"
                }
              />
            </>
          }
        />
        <div className="mt-4">
          <StageProgressBar currentStage={event.currentStage} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card tone="subtle">
            <CardHeader className="pb-3">
              <CardTitle>Event details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={Calendar}
                  label="Event date"
                  value={
                    event.eventDateEnd
                      ? `${formatDateLong(event.eventDateStart)} – ${formatDateLong(event.eventDateEnd)}`
                      : formatDateLong(event.eventDateStart)
                  }
                />
                {event.venueName && (
                  <DetailItem
                    icon={MapPin}
                    label="Venue"
                    value={`${event.venueName}${event.venueAddress ? `, ${event.venueAddress}` : ""}`}
                  />
                )}
                <DetailItem
                  icon={PackageIcon}
                  label="Package"
                  value={`${event.packageType.charAt(0).toUpperCase() + event.packageType.slice(1)} · ${event.eventType}`}
                />
                {event.machineType && (
                  <DetailItem
                    icon={Monitor}
                    label="Machine"
                    value={event.machineType}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card tone="subtle">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Your required actions</CardTitle>
              <span className="text-overline text-muted-foreground tabular-nums">
                {completedCount}/{customerTasks.length} complete
              </span>
            </CardHeader>
            <CardContent>
              <TaskChecklist tasks={customerTasks} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card tone="subtle">
            <CardHeader className="pb-3">
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTimeline
                milestones={milestones}
                compact
                tasks={tasks}
                viewerRole={user.role}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-3">
      <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-overline text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
