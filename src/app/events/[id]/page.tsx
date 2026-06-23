/**
 * Event overview — the customer's (or internal user's) deep view of a
 * single event. Uses EventPageShell for consistent chrome.
 */

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Monitor,
  Package as PackageIcon,
  Share2,
  MessageCircle,
  CalendarClock,
  ListChecks,
  Files,
  GitBranch,
} from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import {
  GlassCard,
  GlassCardHeader,
  KpiGrid,
  KpiCard,
} from "@/components/cloud";
import { HealthBadge, StageBadge } from "@/components/ui/StatusBadge";
import { TaskChecklist } from "@/components/events/TaskChecklist";
import { OverviewNextStep } from "@/components/events/OverviewNextStep";
import { OverviewSidebar } from "@/components/events/OverviewSidebar";
import { IntegrationStatus } from "@/components/ui/IntegrationStatus";
import { SaveAsTemplateButton } from "@/components/admin/SaveAsTemplateButton";

import { getEventById } from "@/lib/queries/events";
import { getMilestonesByEvent } from "@/lib/queries/milestones";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getApprovalsByEvent } from "@/lib/queries/approvals";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getRecentAuditEntries } from "@/lib/queries/audit";
import { getTeamForEvent } from "@/lib/queries/team";
import { getUser } from "@/lib/auth";
import { isInternalRole, canAdvanceEventStage } from "@/lib/roles";
import { stageLabelFor } from "@/lib/customer-copy";
import { STAGE_CONFIG } from "@/types";
import type { Event } from "@/types";
import { formatDateLong, daysUntilDate, isOverdue } from "@/lib/dates";
import { resolveEventNextStep } from "@/lib/event-next-step";
import { canAdvanceStage } from "@/app/actions/stages";

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
  const [milestones, tasks, assets, approvals, unread, recentActivity, teamMembers] = await Promise.all([
    getMilestonesByEvent(id),
    getTasksByEvent(id),
    getAssetsByEvent(id),
    getApprovalsByEvent(id),
    getUnreadCount(user.id),
    getRecentAuditEntries(id, 5),
    getTeamForEvent(id),
  ]);

  const customerTasks = tasks.filter((t) => t.customerVisible);
  const pendingCustomerTasks = customerTasks.filter(
    (t) => t.status !== "complete" && t.status !== "skipped",
  );
  const completedCount = customerTasks.filter(
    (t) => t.status === "complete",
  ).length;

  const myTasks = isInternal
    ? tasks.filter(
        (t) =>
          t.status !== "complete" &&
          t.status !== "skipped" &&
          (t.assignedRole === user.role ||
            t.assignedTo?.id === user.id),
      )
    : pendingCustomerTasks;
  const days = daysUntilDate(event.eventDateStart);
  const stageConfig = STAGE_CONFIG[event.currentStage];
  const stageLabel = stageLabelFor(event.currentStage, !isInternal);
  // Lifecycle is driven by STAGE, not the calendar — an event is only
  // "wrapped" once it reaches reporting/complete, never because its date passed.
  const delivered =
    event.currentStage === "reporting" || event.currentStage === "complete";

  const nextStep = resolveEventNextStep({
    event,
    tasks,
    assets,
    approvals,
    isInternal,
  });

  const stageGate = isInternal
    ? await canAdvanceStage(id)
    : { canAdvance: false, blockers: [] };

  const missedMilestones = milestones.filter(
    (m) =>
      m.status !== "complete" &&
      m.status !== "skipped" &&
      isOverdue(m.targetDate),
  ).length;

  const venue = event.venueName ?? (isInternal ? "the venue" : "your venue");
  const heroSubtitle = (() => {
    if (delivered) {
      return isInternal
        ? `Delivered — report published for ${event.account.name}. Currently at ${stageConfig.label}.`
        : `Delivered — reports and reads are in your inbox. Currently at ${stageConfig.label}.`;
    }
    if (days > 0) {
      return `Live in ${days} ${days === 1 ? "day" : "days"} at ${venue}. Currently at ${stageConfig.label}.`;
    }
    if (days === 0) return `Live today at ${venue}.`;
    // Date has passed but the event isn't reported yet — still being delivered.
    return `Live now at ${venue}. Currently at ${stageConfig.label}.`;
  })();

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Overview"
      slug="overview"
      eyebrow={event.account.name}
      title={event.name}
      subtitle={heroSubtitle}
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <HealthBadge status={event.healthStatus} isCustomer={!isInternal} />
          <StageBadge stage={event.currentStage} isCustomer={!isInternal} />
          <Link
            href={`/events/${id}/communications`}
            className="inline-flex items-center gap-1.5 text-overline text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Messages
          </Link>
          {isInternal && (
            <Link
              href={`/events/${id}/timeline`}
              className="inline-flex items-center gap-1.5 text-overline text-[var(--color-bb-cobalt)] hover:opacity-80 transition-opacity"
            >
              <Share2 className="h-3.5 w-3.5" /> Timeline
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-8 py-6">
        {nextStep && (
          <OverviewNextStep
            nextStep={nextStep}
            isInternal={isInternal}
            canManageStage={canAdvanceEventStage(user.role)}
            eventId={id}
            currentStage={event.currentStage}
            canAdvance={stageGate.canAdvance}
            blockers={stageGate.blockers}
          />
        )}

        <KpiGrid>
          <KpiCard
            label="Time to event"
            value={delivered ? "Wrapped" : days > 0 ? `${days}d` : days === 0 ? "Today" : "Live"}
            icon={CalendarClock}
            hint={event.venueName ?? undefined}
          />
          <KpiCard
            label={isInternal ? "Open actions" : "Your actions"}
            value={isInternal ? myTasks.length : pendingCustomerTasks.length}
            icon={ListChecks}
            hint={isInternal ? "assigned to you" : undefined}
          />
          <KpiCard label="Assets" value={assets.length} icon={Files} />
          <KpiCard
            label="Stage"
            value={`${stageConfig.order + 1}/10`}
            icon={GitBranch}
            hint={stageLabel}
          />
        </KpiGrid>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
          <div className="space-y-6 min-w-0">
            <GlassCard>
              <GlassCardHeader
                title={isInternal ? "Your actions" : "What's needed from you"}
                action={
                  <span className="text-overline text-muted-foreground tabular-nums">
                    {isInternal
                      ? `${myTasks.length} open`
                      : `${completedCount} of ${customerTasks.length} complete`}
                  </span>
                }
              />
              <div className="p-6">
                {isInternal ? (
                  myTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nothing assigned to your role right now.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {myTasks.slice(0, 8).map((task) => (
                        <li key={task.id}>
                          <Link
                            href={`/events/${id}/${task.targetPath ?? "actions"}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/40"
                          >
                            <span className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </span>
                            {task.priority === "critical" || task.priority === "high" ? (
                              <span className={`text-[10px] font-semibold ${task.priority === "critical" ? "text-destructive" : "text-warning"}`}>
                                {task.priority === "critical" ? "Critical" : "High"}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )
                ) : customerTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nothing for you to do right now. We&apos;ll ping you when
                    something needs your eyes.
                  </p>
                ) : (
                  <TaskChecklist tasks={customerTasks} viewerRole={user.role} />
                )}
                <Link
                  href={`/events/${id}/actions`}
                  className="mt-4 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
                >
                  {isInternal ? "View all tasks →" : "Open all actions →"}
                </Link>
              </div>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader title="The details" />
              <div className="p-6">
                <EventDetails event={event} />
              </div>
            </GlassCard>

            {isInternal && (
              <GlassCard>
                <GlassCardHeader title="Internal" />
                <div className="p-6 space-y-6">
                  <IntegrationStatus
                    webhookConfigured={!!process.env.BRIGHTBLUE_WEBHOOK_SECRET}
                    cloudApiConfigured={!!process.env.BRIGHTBLUE_API_KEY}
                  />
                  <Hairline className="opacity-40" />
                  <div>
                    <EditorialEyebrow>Template</EditorialEyebrow>
                    <div className="mt-3">
                      <SaveAsTemplateButton eventId={id} />
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          <OverviewSidebar
            eventId={id}
            milestones={milestones}
            tasks={tasks}
            approvals={approvals}
            viewerRole={user.role}
            daysToEvent={days}
            pendingActionsCount={pendingCustomerTasks.length}
            missedMilestonesCount={missedMilestones}
            recentActivity={recentActivity}
            teamMembers={teamMembers}
          />
        </section>
      </div>
    </EventPageShell>
  );
}

function EventDetails({ event }: { event: Event }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <DetailItem
          icon={Calendar}
          label="Event date"
          value={
            event.eventDateEnd
              ? `${formatDateLong(event.eventDateStart)} → ${formatDateLong(event.eventDateEnd)}`
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
          value={`${event.packageType.charAt(0).toUpperCase()}${event.packageType.slice(1)} · ${event.eventType}`}
        />
        {event.machineType && (
          <DetailItem icon={Monitor} label="Machine" value={event.machineType} />
        )}
      </div>
    </div>
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
    <div className="flex items-start gap-3">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-overline text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm text-foreground leading-snug">{value}</p>
      </div>
    </div>
  );
}
