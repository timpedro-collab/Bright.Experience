/** Event actions — full task list with progress & smart grouping. */
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { TaskChecklist } from "@/components/events/TaskChecklist";
import { TaskViewToggle } from "@/components/events/TaskViewToggle";
import { DeadlineTimeline } from "@/components/events/DeadlineTimeline";
import { EmptyState } from "@/components/ui/EmptyState";

import { getEventById } from "@/lib/queries/events";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getDeadlinesByEvent } from "@/lib/queries/deadlines";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { ownerForTask } from "@/lib/ownership";

export default async function ActionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "actions")) redirect(`/events/${id}`);
  const { view } = await searchParams;
  const isInternal = isInternalRole(user.role);
  const [event, tasks, unread, deadlines] = await Promise.all([
    getEventById(id),
    getTasksByEvent(id),
    getUnreadCount(user.id),
    // Customers have no separate Deadlines tab — their schedule is folded in
    // here as a "by due date" view. Internal keep the dedicated page.
    isInternal ? Promise.resolve([]) : getDeadlinesByEvent(id),
  ]);
  if (!event) return notFound();

  const showAll = view === "all";
  // Customer schedule: only their own dated obligations, most urgent first.
  const customerSchedule = deadlines.filter((d) => d.owner === "customer");

  const allTasks = isInternal
    ? tasks
    : tasks.filter(
        (t) => t.customerVisible && t.taskType === "customer_action",
      );

  // "Your actions" for an internal user = open work they own. Customer-owned
  // tasks (briefing, asset upload, etc.) never belong here, regardless of any
  // internal assigned_role left on the row.
  const myTasks = isInternal
    ? tasks.filter(
        (t) =>
          ownerForTask(t) !== "customer" &&
          t.status !== "complete" &&
          t.status !== "skipped" &&
          (t.assignedRole === user.role || t.assignedTo?.id === user.id),
      )
    : allTasks;

  const visibleTasks = isInternal && !showAll ? myTasks : allTasks;
  const allCount = allTasks.length;
  const myCount = myTasks.length;

  const completed = visibleTasks.filter((t) => t.status === "complete").length;
  const total = visibleTasks.length;
  const blocking = visibleTasks.filter(
    (t) => t.isBlocking && t.status !== "complete",
  ).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Actions"
      isInternal={isInternal}
      viewerRole={user.role}
      title={
        total === 0
          ? "All clear."
          : `${total - completed} item${total - completed === 1 ? "" : "s"} remaining.`
      }
      subtitle={
        isInternal
          ? "Actions for this event only — your cross-event list lives in your Inbox. Switch views to see your own or everyone's."
          : "Tick off these items to keep your event moving forward."
      }
      heroRight={
        total > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {pct}%
            </span>{" "}
            complete · {total} total
          </div>
        ) : null
      }
    >
      {isInternal && (
        <section className="py-4">
          <TaskViewToggle
            eventId={id}
            currentView={showAll ? "all" : "mine"}
            myCount={myCount}
            allCount={allCount}
          />
        </section>
      )}

      {blocking > 0 && (
        <section className="pt-4 pb-2">
          <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-foreground/90 leading-snug">
              <span className="font-semibold text-destructive">
                {blocking} blocking action{blocking === 1 ? "" : "s"}
              </span>{" "}
              {blocking === 1 ? "is" : "are"} holding up delivery — clear{" "}
              {blocking === 1 ? "it" : "them"} first.
            </p>
          </div>
        </section>
      )}

      {total > 0 && (
        <>
          <section className="py-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <EditorialEyebrow accent>Progress</EditorialEyebrow>
              <span className="text-overline text-muted-foreground tabular-nums">
                {completed} of {total} complete
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className="h-full rounded-full bg-[var(--color-bb-cobalt)] transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </section>

          <Hairline className="opacity-60" />
        </>
      )}

      {visibleTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear"
          description="You don't have any actions assigned right now. We'll let you know if anything new comes up."
          action={{ label: "Return to Overview", href: `/events/${id}` }}
        />
      ) : (
        <section className="py-10">
          <EditorialEyebrow>
            {isInternal && !showAll ? "Your actions" : "Every action"}
          </EditorialEyebrow>
          <div className="mt-6">
            <TaskChecklist
              tasks={visibleTasks}
              showInternalTasks={isInternal}
              isInternal={isInternal}
              viewerRole={user.role}
            />
          </div>
        </section>
      )}

      {!isInternal && customerSchedule.length > 0 && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-10">
            <EditorialEyebrow>By due date</EditorialEyebrow>
            <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
              Everything on your plate, ordered by when it&apos;s needed.
            </p>
            <div className="mt-6">
              <DeadlineTimeline
                deadlines={customerSchedule}
                viewerRole={user.role}
              />
            </div>
          </section>
        </>
      )}
    </EventPageShell>
  );
}
