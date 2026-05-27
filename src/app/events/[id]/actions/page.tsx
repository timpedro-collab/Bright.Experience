/** Event actions — full task list with progress & smart grouping. */
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { TaskChecklist } from "@/components/events/TaskChecklist";
import { EmptyState } from "@/components/ui/EmptyState";

import { getEventById } from "@/lib/queries/events";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function ActionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, tasks, unread] = await Promise.all([
    getEventById(id),
    getTasksByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  const visibleTasks = isInternal
    ? tasks
    : tasks.filter((t) => t.customerVisible);
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
      title={
        total === 0
          ? "All clear."
          : `${total - completed} item${total - completed === 1 ? "" : "s"} remaining.`
      }
      subtitle={
        blocking > 0
          ? `${blocking} blocking action${blocking === 1 ? "" : "s"} need${blocking === 1 ? "s" : ""} your attention to keep delivery on track.`
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
          action={{ label: "Back to overview", href: `/events/${id}` }}
        />
      ) : (
        <section className="py-10">
          <EditorialEyebrow>Every action</EditorialEyebrow>
          <div className="mt-6">
            <TaskChecklist
              tasks={visibleTasks}
              showInternalTasks={isInternal}
              isInternal={isInternal}
            />
          </div>
        </section>
      )}

      {blocking > 0 && (
        <section className="py-6">
          <div className="border-l-2 border-destructive pl-4 py-2">
            <p className="text-overline text-destructive inline-flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Blocking delivery
            </p>
            <p className="mt-1 text-sm text-foreground/90 leading-snug max-w-[60ch]">
              {blocking} blocking action{blocking === 1 ? "" : "s"} above
              {blocking === 1 ? " is" : " are"} preventing this event from
              advancing. Address them first to unblock delivery.
            </p>
          </div>
        </section>
      )}
    </EventPageShell>
  );
}
