/** Event overview — right sidebar with timeline preview, team, and KPIs. */
import Link from "next/link";

import { EditorialEyebrow, Hairline } from "@/components/brand";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { MilestoneTimeline } from "@/components/timeline/MilestoneTimeline";
import { EventOwnershipPanel } from "@/components/events/EventOwnershipPanel";
import { ActivityFeed } from "@/components/events/ActivityFeed";
import { TeamRequestButton } from "@/components/events/TeamRequestButton";
import { TeamApprovalButtons } from "@/components/events/TeamApprovalButtons";
import { MetricRow } from "@/components/events/MetricRow";
import { YourTeamWidget } from "@/components/events/YourTeamWidget";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { ownerForTask } from "@/lib/ownership";
import { formatDueProximity } from "@/lib/dates";
import type { Milestone, Task, Approval, EventTeamMember, UserRole } from "@/types";
import type { AuditRow } from "@/lib/queries/audit";

interface OverviewSidebarProps {
  eventId: string;
  milestones: Milestone[];
  tasks: Task[];
  approvals: Approval[];
  viewerRole: UserRole;
  daysToEvent: number;
  pendingActionsCount: number;
  missedMilestonesCount: number;
  recentActivity?: AuditRow[];
  teamMembers?: EventTeamMember[];
}

export function OverviewSidebar({
  eventId,
  milestones,
  tasks,
  approvals,
  viewerRole,
  daysToEvent,
  pendingActionsCount,
  missedMilestonesCount,
  recentActivity = [],
  teamMembers = [],
}: OverviewSidebarProps) {
  const blockingCount = tasks.filter(
    (t) => t.isBlocking && t.status !== "complete",
  ).length;
  const pendingApprovals = approvals.filter(
    (a) => a.status === "pending",
  ).length;

  const upcomingTasks = tasks
    .filter(
      (t) =>
        t.status === "pending" &&
        ownerForTask(t) !== "customer" &&
        t.assignedRole === viewerRole,
    )
    .slice(0, 3);

  return (
    <aside className="space-y-10">
      <div>
        <EditorialEyebrow>Timeline</EditorialEyebrow>
        <div className="mt-4">
          <MilestoneTimeline
            milestones={milestones}
            compact
            tasks={tasks}
            viewerRole={viewerRole}
          />
        </div>
        <Link
          href={`/events/${eventId}/timeline`}
          className="mt-3 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
        >
          Open the full timeline →
        </Link>
      </div>

      <Hairline />

      <div>
        <EditorialEyebrow>Where things sit</EditorialEyebrow>
        <div className="mt-4">
          <EventOwnershipPanel
            tasks={tasks}
            viewerRole={viewerRole}
            ctaHref={`/events/${eventId}/actions`}
          />
        </div>
        {!isInternalRole(viewerRole) ? (
          <div className="mt-6">
            <EditorialEyebrow>Your team</EditorialEyebrow>
            <div className="mt-4">
              <YourTeamWidget eventId={eventId} members={teamMembers} />
              <div className="mt-3">
                <TeamRequestButton eventId={eventId} />
              </div>
            </div>
          </div>
        ) : teamMembers.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {teamMembers.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <span className="flex items-center justify-center size-6 rounded-full bg-card border border-border text-[0.625rem] text-foreground">
                  {(m.profile?.name?.[0] ?? m.email[0]).toUpperCase()}
                </span>
                <span className="truncate text-foreground">
                  {m.profile?.name ?? m.email}
                </span>
                {m.status === "pending" ? (
                  <TeamApprovalButtons memberId={m.id} />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Hairline />

      <div>
        <div className="flex items-center justify-between">
          <EditorialEyebrow>The numbers</EditorialEyebrow>
          <ExportMenu eventId={eventId} view="overview" hidePdf />
        </div>
        <ul className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
          <MetricRow
            label="Days to event"
            value={
              daysToEvent === 0
                ? "Today"
                : daysToEvent > 0
                  ? `${daysToEvent}`
                  : `${Math.abs(daysToEvent)} ago`
            }
          />
          <MetricRow
            label="Pending actions"
            value={pendingActionsCount.toString()}
            tone={pendingActionsCount > 0 ? "warning" : "muted"}
          />
          <MetricRow
            label="Blocking"
            value={blockingCount.toString()}
            tone={blockingCount > 0 ? "destructive" : "muted"}
          />
          <MetricRow
            label="Approvals pending"
            value={pendingApprovals.toString()}
            tone={pendingApprovals > 0 ? "warning" : "muted"}
          />
          <MetricRow
            label="Missed milestones"
            value={missedMilestonesCount.toString()}
            tone={missedMilestonesCount > 0 ? "destructive" : "muted"}
          />
        </ul>
      </div>

      {upcomingTasks.length > 0 && (
        <>
          <Hairline />
          <div>
            <EditorialEyebrow>Coming up</EditorialEyebrow>
            <ul className="mt-3 flex flex-col gap-2">
              {upcomingTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/events/${eventId}/${t.targetPath ?? "actions"}`}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors"
                  >
                    <span className="truncate text-foreground">{t.title}</span>
                    {t.dueDate && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDueProximity(t.dueDate)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Activity feed is internal-only — customers use Actions / Messages, not the audit log. */}
      {canViewSection(viewerRole, "activity") && recentActivity.length > 0 && (
        <>
          <Hairline />
          <div>
            <EditorialEyebrow>Recent activity</EditorialEyebrow>
            <div className="mt-4">
              <ActivityFeed entries={recentActivity} compact />
            </div>
            <Link
              href={`/events/${eventId}/activity`}
              className="mt-3 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
            >
              View all activity →
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}

