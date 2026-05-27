/**
 * Event overview — the customer's (or internal user's) deep view of a
 * single event. Uses the editorial Bright.Experience design language:
 *   - <RidgeHero> with a deterministic ridge artwork seeded by event id
 *   - editorial "What's next" callout (no glass, no gradient orbs)
 *   - hairline-separated body with a 2-column reading layout
 *   - tracked uppercase eyebrows, italic-underlined cobalt CTAs
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
  ArrowRight,
} from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  EditorialEyebrow,
  Hairline,
} from "@/components/brand";
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
import { formatDateLong, daysUntilDate, isOverdue } from "@/lib/dates";
import { resolveEventNextStep } from "@/lib/event-next-step";
import { canAdvanceStage } from "@/app/actions/stages";
import { AdvanceStageButton } from "@/components/events/AdvanceStageButton";

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
    (t) => t.status !== "complete" && t.status !== "skipped",
  );
  const completedCount = customerTasks.filter(
    (t) => t.status === "complete",
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

  const stageGate = isInternal
    ? await canAdvanceStage(id)
    : { canAdvance: false, blockers: [] };

  const missedMilestones = milestones.filter(
    (m) =>
      m.status !== "complete" &&
      m.status !== "skipped" &&
      isOverdue(m.targetDate)
  ).length;

  const heroSubtitle = (() => {
    if (days > 0) {
      return `Live in ${days} ${days === 1 ? "day" : "days"} at ${event.venueName ?? "your venue"}. Currently at ${stageConfig.label}.`;
    }
    if (days === 0) return `Live today at ${event.venueName ?? "your venue"}.`;
    return `Wrapped ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago. Reports and reads landing in your inbox.`;
  })();

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: event.name },
        ]}
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

      <RidgeHero
        seed={event.id}
        eyebrow={event.account.name}
        title={event.name}
        subtitle={heroSubtitle}
        rightSlot={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <HealthBadge status={event.healthStatus} />
            <StageBadge stage={event.currentStage} />
            <Link
              href={`/events/${id}/communications`}
              className="inline-flex items-center gap-1.5 text-overline text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Messages
            </Link>
            <Link
              href={`/events/${id}/timeline`}
              className="inline-flex items-center gap-1.5 text-overline text-[var(--color-bb-cobalt)] hover:opacity-80 transition-opacity"
            >
              <Share2 className="h-3.5 w-3.5" /> Timeline
            </Link>
          </div>
        }
      />

      <EditionBody>
        {/* Next-step editorial callout — flat, typographic, no glass orbs.
            Tone drives the accent colour on the eyebrow + primary CTA so
            "warning" reads visually different to "success". */}
        {nextStep && (
          <section className="py-10 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:gap-12 items-end">
              <div>
                <EditorialEyebrow accent={nextStep.tone !== "warning"}>
                  {nextStep.eyebrow}
                </EditorialEyebrow>
                <h2 className="text-heading text-foreground text-[clamp(1.5rem,3vw,2.25rem)] leading-tight mt-2 max-w-[32ch]">
                  {nextStep.title}
                </h2>
                {nextStep.description && (
                  <p className="mt-3 max-w-[58ch] text-base text-muted-foreground leading-relaxed">
                    {nextStep.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col md:items-end gap-2 mt-4 md:mt-0">
                <Link
                  href={nextStep.primaryAction.href}
                  className={`inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity ${
                    nextStep.tone === "warning"
                      ? "bg-warning"
                      : nextStep.tone === "success"
                        ? "bg-success"
                        : "bg-[var(--color-bb-cobalt)]"
                  }`}
                >
                  {nextStep.primaryAction.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {nextStep.secondaryAction && (
                  <Link
                    href={nextStep.secondaryAction.href}
                    className="text-overline text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {nextStep.secondaryAction.label} →
                  </Link>
                )}
              </div>
            </div>
            {isInternal && (
              <div className="mt-6 max-w-md">
                <EditorialEyebrow>Internal · stage gate</EditorialEyebrow>
                <div className="mt-2">
                  <AdvanceStageButton
                    eventId={id}
                    currentStage={event.currentStage}
                    canAdvance={stageGate.canAdvance}
                    blockers={stageGate.blockers}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Stage strip — 10 dashes representing the journey */}
        <section className="py-6">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <EditorialEyebrow>The journey</EditorialEyebrow>
            <span className="text-overline text-muted-foreground tabular-nums">
              Stage {stageConfig.order + 1} of 10 · {stageConfig.label}
            </span>
          </div>
          <StageProgressBar currentStage={event.currentStage} />
        </section>

        {/* Two-column reading layout: actions + details on the left,
            timeline + team + KPIs on the right. */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-x-12 gap-y-10 py-10">
          {/* MAIN COLUMN */}
          <div className="space-y-12 lg:border-r lg:border-border/40 lg:pr-12">
            {/* Your actions */}
            <div>
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <EditorialEyebrow accent>Your actions</EditorialEyebrow>
                <span className="text-overline text-muted-foreground tabular-nums">
                  {completedCount} of {customerTasks.length} complete
                </span>
              </div>
              {customerTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing for you to do right now. We&apos;ll ping you when
                  something needs your eyes.
                </p>
              ) : (
                <TaskChecklist tasks={customerTasks} />
              )}
              <Link
                href={`/events/${id}/actions`}
                className="mt-4 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
              >
                Open all actions →
              </Link>
            </div>

            <Hairline />

            {/* Event details */}
            <div>
              <EditorialEyebrow>The details</EditorialEyebrow>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
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
                    value={`${event.venueName}${
                      event.venueAddress ? `, ${event.venueAddress}` : ""
                    }`}
                  />
                )}
                <DetailItem
                  icon={PackageIcon}
                  label="Package"
                  value={`${event.packageType.charAt(0).toUpperCase()}${event.packageType.slice(1)} · ${event.eventType}`}
                />
                {event.machineType && (
                  <DetailItem
                    icon={Monitor}
                    label="Machine"
                    value={event.machineType}
                  />
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-10">
            <div>
              <EditorialEyebrow>Timeline</EditorialEyebrow>
              <div className="mt-4">
                <MilestoneTimeline
                  milestones={milestones}
                  compact
                  tasks={tasks}
                  viewerRole={user.role}
                />
              </div>
              <Link
                href={`/events/${id}/timeline`}
                className="mt-3 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
              >
                Open the full timeline →
              </Link>
            </div>

            <Hairline />

            <div>
              <EditorialEyebrow>Your team</EditorialEyebrow>
              <div className="mt-4">
                <EventOwnershipPanel
                  tasks={tasks}
                  viewerRole={user.role}
                  ctaHref={`/events/${id}/actions`}
                />
              </div>
            </div>

            <Hairline />

            <div>
              <EditorialEyebrow>The numbers</EditorialEyebrow>
              <ul className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                <MetricRow
                  label="Days to event"
                  value={
                    days === 0
                      ? "Today"
                      : days > 0
                        ? `${days}`
                        : `${Math.abs(days)} ago`
                  }
                />
                <MetricRow
                  label="Pending actions"
                  value={pendingCustomerTasks.length.toString()}
                  tone={
                    pendingCustomerTasks.length > 0 ? "warning" : "muted"
                  }
                />
                <MetricRow
                  label="Blocking"
                  value={tasks
                    .filter((t) => t.isBlocking && t.status !== "complete")
                    .length.toString()}
                  tone={
                    tasks.some((t) => t.isBlocking && t.status !== "complete")
                      ? "destructive"
                      : "muted"
                  }
                />
                <MetricRow
                  label="Approvals pending"
                  value={approvals
                    .filter((a) => a.status === "pending")
                    .length.toString()}
                  tone={
                    approvals.some((a) => a.status === "pending")
                      ? "warning"
                      : "muted"
                  }
                />
                <MetricRow
                  label="Missed milestones"
                  value={missedMilestones.toString()}
                  tone={missedMilestones > 0 ? "destructive" : "muted"}
                />
              </ul>
            </div>
          </aside>
        </section>
      </EditionBody>

      <EditionFooter
        rightSlot={
          <Link href="/" className="hover:opacity-80 transition-opacity">
            Back to home →
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
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

function MetricRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "warning" | "destructive";
}) {
  const toneClass = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-base font-semibold tabular-nums ${toneClass}`}
      >
        {value}
      </span>
    </li>
  );
}
