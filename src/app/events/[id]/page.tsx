/**
 * Event overview — the customer's (or internal user's) deep view of a
 * single event. Uses EventPageShell for consistent chrome.
 *
 * Streams: the hero shell renders as soon as the event row is loaded;
 * the heavy content (tasks, assets, approvals, activity, team) resolves
 * behind a Suspense boundary so first paint isn't gated on eight queries.
 */

import { Suspense } from "react";
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
import { getCustomerActionItems } from "@/lib/queries/deadlines";
import { getUser } from "@/lib/auth";
import { isInternalRole, canAdvanceEventStage } from "@/lib/roles";
import { ownerForTask } from "@/lib/ownership";
import { RemindCustomerButton } from "@/components/events/RemindCustomerButton";
import { EventHealthControl } from "@/components/events/EventHealthControl";
import { stageLabelFor, customerStatusLine } from "@/lib/customer-copy";
import { CustomerEventBody } from "@/components/events/CustomerEventBody";
import { STAGE_CONFIG } from "@/types";
import type { Event } from "@/types";
import { formatDateLong, formatDateShort, daysUntilDate, isOverdue } from "@/lib/dates";
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
  const [event, unread] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  const days = daysUntilDate(event.eventDateStart);
  // Lifecycle is driven by STAGE, not the calendar — an event is only
  // "wrapped" once it reaches reporting/complete, never because its date passed.
  const delivered =
    event.currentStage === "reporting" || event.currentStage === "complete";

  const venue = event.venueName ?? "the venue";
  // Internal keeps the operational "Currently at {label}"; customers get one
  // calm status line ("Ready for your approval · Live in 12 days at ExCeL").
  const heroStageLabel = stageLabelFor(event.currentStage, false);
  const heroSubtitle = isInternal
    ? (() => {
        const stagePhrase = ` Currently at ${heroStageLabel}.`;
        if (delivered) {
          return `Delivered — report published for ${event.account.name}.${stagePhrase}`;
        }
        if (days > 0) {
          return `Live in ${days} ${days === 1 ? "day" : "days"} at ${venue}.${stagePhrase}`;
        }
        if (days === 0) return `Live today at ${venue}.`;
        return `Live now at ${venue}.${stagePhrase}`;
      })()
    : customerStatusLine(event);

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
          {/* Stage now lives in the customer status line; internal keeps the badge. */}
          {isInternal && <StageBadge stage={event.currentStage} isCustomer={false} />}
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
      <Suspense fallback={<OverviewContentSkeleton />}>
        <OverviewContent
          id={id}
          event={event}
          user={user}
          isInternal={isInternal}
          days={days}
          delivered={delivered}
        />
      </Suspense>
    </EventPageShell>
  );
}

/**
 * The heavy half of the overview — everything that needs the seven
 * content queries. Rendered behind Suspense so the hero streams first.
 */
async function OverviewContent({
  id,
  event,
  user,
  isInternal,
  days,
  delivered,
}: {
  id: string;
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>;
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>;
  isInternal: boolean;
  days: number;
  delivered: boolean;
}) {
  const [milestones, tasks, assets, approvals, recentActivity, teamMembers, customerActionItems] =
    await Promise.all([
      getMilestonesByEvent(id),
      getTasksByEvent(id),
      getAssetsByEvent(id),
      getApprovalsByEvent(id),
      getRecentAuditEntries(id, 5),
      getTeamForEvent(id),
      // Same source as CustomerDashboard "Needs you" — tasks + assets + briefings.
      isInternal ? Promise.resolve([]) : getCustomerActionItems(id),
    ]);

  const customerTasks = tasks.filter(
    (t) => t.customerVisible && t.taskType === "customer_action",
  );
  const pendingCustomerTasks = customerTasks.filter(
    (t) => t.status !== "complete" && t.status !== "skipped",
  );
  const nextStep = resolveEventNextStep({
    event,
    tasks,
    assets,
    approvals,
    isInternal,
  });

  const missedMilestones = milestones.filter(
    (m) =>
      m.status !== "complete" &&
      m.status !== "skipped" &&
      isOverdue(m.targetDate),
  ).length;

  // Customer surface: one calm single-column body (action block, journey,
  // team, quiet disclosures). Internal keeps the operational layout below.
  if (!isInternal) {
    const approvalsPending = approvals.filter(
      (a) => a.status === "pending",
    ).length;
    return (
      <CustomerEventBody
        eventId={id}
        event={event}
        milestones={milestones}
        items={customerActionItems}
        nextStep={nextStep}
        teamMembers={teamMembers}
        metrics={{
          daysToEvent: days,
          delivered,
          pendingActions: customerActionItems.length,
          approvalsPending,
          missedMilestones,
        }}
      />
    );
  }

  // ---- Internal layout (customers returned above) ----
  // Internal "Your actions" = work this viewer actually OWNS. A
  // `customer_action` is the customer's job no matter what internal
  // `assigned_role` it carries (that field names the internal *chaser*, not
  // the doer), so it must never appear as the staff member's own to-do.
  const myTasks = tasks.filter(
    (t) =>
      t.status !== "complete" &&
      t.status !== "skipped" &&
      ownerForTask(t) !== "customer" &&
      (t.assignedRole === user.role || t.assignedTo?.id === user.id),
  );

  // Customer-owned work an internal viewer can only *nudge*, never tick off
  // from here. Surfaced as a separate "Awaiting the customer" panel.
  const awaitingCustomer = pendingCustomerTasks;
  const stageConfig = STAGE_CONFIG[event.currentStage];
  const stageLabel = stageLabelFor(event.currentStage, false);
  const stageGate = await canAdvanceStage(id);

  return (
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
            label="Open actions"
            value={myTasks.length}
            icon={ListChecks}
            hint="assigned to you"
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
                title="Your actions"
                action={
                  <span className="text-overline text-muted-foreground tabular-nums">
                    {`${myTasks.length} open`}
                  </span>
                }
              />
              <div className="p-6">
                {myTasks.length === 0 ? (
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
                )}
                <Link
                  href={`/events/${id}/actions`}
                  className="mt-4 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
                >
                  View all tasks →
                </Link>
              </div>
            </GlassCard>

            {awaitingCustomer.length > 0 && (
              <GlassCard>
                <GlassCardHeader
                  title="Awaiting the customer"
                  description="Their move, not yours — send a nudge if it's stalling"
                  action={
                    <span className="text-overline text-muted-foreground tabular-nums">
                      {awaitingCustomer.length} open
                    </span>
                  }
                />
                <div className="p-6">
                  <ul className="space-y-2">
                    {awaitingCustomer.map((task) => {
                      const overdue = isOverdue(task.dueDate);
                      return (
                        <li
                          key={task.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </p>
                            {task.dueDate && (
                              <p
                                className={`mt-0.5 text-overline tabular-nums ${
                                  overdue ? "text-destructive" : "text-muted-foreground"
                                }`}
                              >
                                {overdue ? "Overdue · " : "Due "}
                                {formatDateShort(task.dueDate)}
                              </p>
                            )}
                          </div>
                          <RemindCustomerButton taskId={task.id} overdue={overdue} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </GlassCard>
            )}

            <GlassCard>
              <GlassCardHeader title="The details" />
              <div className="p-6">
                <EventDetails event={event} />
              </div>
            </GlassCard>

            <GlassCard>
              <GlassCardHeader title="Internal" />
              <div className="p-6 space-y-6">
                <IntegrationStatus
                  webhookConfigured={!!process.env.BRIGHTBLUE_WEBHOOK_SECRET}
                  cloudApiConfigured={!!process.env.BRIGHTBLUE_API_KEY}
                />
                <Hairline className="opacity-40" />
                <div>
                  <EditorialEyebrow>Delivery health</EditorialEyebrow>
                  <div className="mt-3">
                    <EventHealthControl
                      eventId={id}
                      status={event.healthStatus}
                      reason={event.healthReason}
                    />
                  </div>
                </div>
                <Hairline className="opacity-40" />
                <div>
                  <EditorialEyebrow>Template</EditorialEyebrow>
                  <div className="mt-3">
                    <SaveAsTemplateButton eventId={id} />
                  </div>
                </div>
              </div>
            </GlassCard>
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
  );
}

/** Shape-matched shimmer for the streamed overview content. */
function OverviewContentSkeleton() {
  return (
    <div className="space-y-8 py-6">
      <div className="h-24 rounded-2xl border border-border/40 bg-muted/20 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-border/40 bg-muted/20 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
        <div className="space-y-6">
          <div className="h-64 rounded-2xl border border-border/40 bg-muted/20 animate-pulse" />
          <div className="h-40 rounded-2xl border border-border/40 bg-muted/20 animate-pulse" />
        </div>
        <div className="h-96 rounded-2xl border border-border/40 bg-muted/20 animate-pulse" />
      </div>
    </div>
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
