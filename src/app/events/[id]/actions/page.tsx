/** Event actions — full task list with progress & smart grouping */
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { TaskChecklist } from "@/components/events/TaskChecklist";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const customerTasks = tasks.filter((t) => t.customerVisible);
  const completed = customerTasks.filter((t) => t.status === "complete").length;
  const total = customerTasks.length;
  const blocking = customerTasks.filter(
    (t) => t.isBlocking && t.status !== "complete"
  ).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Required actions" />

      <PageHeader
        eyebrow="Your actions"
        title={total === 0 ? "No required actions" : `${total - completed} item${total - completed === 1 ? "" : "s"} remaining`}
        subtitle={
          blocking > 0
            ? `${blocking} blocking action${blocking === 1 ? "" : "s"} need${blocking === 1 ? "s" : ""} your attention to keep delivery on track.`
            : "Tick off these items to keep your event moving forward."
        }
        meta={
          <>
            <Badge variant="default">{pct}% complete</Badge>
            <Badge variant="muted">{total} total</Badge>
            {blocking > 0 && <Badge variant="destructive">{blocking} blocking</Badge>}
          </>
        }
      />

      <Card tone="subtle" className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {completed} of {total} complete
            </span>
            <span className="text-heading text-xl font-bold tabular-nums text-primary">
              {pct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,hsl(223,94%,53%),hsl(189,100%,75%))] transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {customerTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear"
          description="You don't have any actions assigned right now. We'll let you know if anything new comes up."
          action={{ label: "Back to overview", href: `/events/${id}` }}
        />
      ) : (
        <Card tone="subtle">
          <CardContent className="p-6">
            <TaskChecklist tasks={customerTasks} />
          </CardContent>
        </Card>
      )}

      {blocking > 0 && (
        <div className="mt-6 rounded-[var(--radius-control)] border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-start gap-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {blocking} blocking action{blocking === 1 ? "" : "s"} above are
              preventing this event from advancing. Address them first to
              unblock delivery.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
