/**
 * Internal Inbox — every open (and optionally recently completed)
 * task assigned to the current user, across every event they touch.
 *
 * URL filters (all optional):
 *   ?event={id} — restrict to a single event
 *   ?category={creative|operations|qa|...} — restrict to one category
 *   ?status={open|recent|all} — defaults to "open"
 *
 * Pairs with the dashboard `MyTasksPanel`: the panel is a top-8
 * preview, this page is the deep-dive list.
 */

import { redirect } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  InboxFilters,
  type InboxEventOption,
} from "@/components/inbox/InboxFilters";
import { CheckCircle2, AlertCircle, CalendarClock, Clock } from "lucide-react";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import {
  getTasksAssignedToUser,
  type AssignedTaskWithContext,
} from "@/lib/queries/tasks";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  daysUntilDate,
  formatDateShort,
  isOverdue,
  timeSince,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TaskCategory } from "@/types";

export const metadata = {
  title: "Inbox · Bright.Experience",
};

const ALL_CATEGORIES: TaskCategory[] = [
  "creative",
  "operations",
  "qa",
  "development",
  "logistics",
  "reporting",
  "admin",
];

const RECENT_WINDOW_DAYS = 14;

interface InboxPageProps {
  searchParams: Promise<{
    event?: string;
    category?: string;
    status?: string;
  }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const params = await searchParams;
  const eventFilter = params.event ?? "all";
  const categoryFilter = (params.category ?? "all") as TaskCategory | "all";
  const statusFilter = params.status ?? "open";

  const includeCompleted =
    statusFilter === "recent" || statusFilter === "all"
      ? new Date(
          Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000
        ).toISOString()
      : undefined;

  const [allTasks, unread] = await Promise.all([
    getTasksAssignedToUser(user.id, { includeCompletedSince: includeCompleted }),
    getUnreadCount(user.id),
  ]);

  // Distinct event list for the filter dropdown — pulled from this
  // user's assigned tasks, not all events, to keep the dropdown short.
  const eventOptionsMap = new Map<string, InboxEventOption>();
  for (const task of allTasks) {
    if (!eventOptionsMap.has(task.eventId)) {
      eventOptionsMap.set(task.eventId, {
        id: task.eventId,
        name: task.eventName,
        accountName: task.accountName,
      });
    }
  }
  const eventOptions = Array.from(eventOptionsMap.values()).sort((a, b) =>
    `${a.accountName ?? ""}${a.name}`.localeCompare(
      `${b.accountName ?? ""}${b.name}`
    )
  );

  let filtered = allTasks;
  if (eventFilter !== "all") {
    filtered = filtered.filter((t) => t.eventId === eventFilter);
  }
  if (categoryFilter !== "all") {
    filtered = filtered.filter((t) => t.category === categoryFilter);
  }
  if (statusFilter === "recent") {
    filtered = filtered.filter((t) => t.status === "complete");
  }
  if (statusFilter === "open") {
    filtered = filtered.filter((t) => t.status !== "complete");
  }

  // Group: overdue → due-soon (3d) → other open → completed.
  const overdue: AssignedTaskWithContext[] = [];
  const dueSoon: AssignedTaskWithContext[] = [];
  const other: AssignedTaskWithContext[] = [];
  const completed: AssignedTaskWithContext[] = [];
  for (const task of filtered) {
    if (task.status === "complete") {
      completed.push(task);
      continue;
    }
    if (task.dueDate && isOverdue(task.dueDate)) {
      overdue.push(task);
      continue;
    }
    if (task.dueDate && daysUntilDate(task.dueDate) <= 3) {
      dueSoon.push(task);
      continue;
    }
    other.push(task);
  }

  const openTotal = overdue.length + dueSoon.length + other.length;

  return (
    <AppShell user={user} isInternal={isInternal} notificationCount={unread}>
      <PageHeader
        eyebrow="Internal"
        title="Inbox"
        subtitle={
          openTotal === 0 && completed.length === 0
            ? "Nothing is on you right now. Take a breath."
            : `${openTotal} open task${openTotal === 1 ? "" : "s"} across ${eventOptions.length} event${eventOptions.length === 1 ? "" : "s"}.`
        }
      />

      <div className="mb-6">
        <InboxFilters events={eventOptions} categories={ALL_CATEGORIES} />
      </div>

      {openTotal === 0 && completed.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Inbox zero"
          description="Every open task assigned to you is filtered out (or there are none). Adjust filters above or take a victory lap."
          size="lg"
        />
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <TaskGroup
              title="Overdue"
              tone="destructive"
              tasks={overdue}
              countLabel="now"
            />
          )}
          {dueSoon.length > 0 && (
            <TaskGroup
              title="Due in the next 3 days"
              tone="warning"
              tasks={dueSoon}
              countLabel="soon"
            />
          )}
          {other.length > 0 && (
            <TaskGroup
              title="Everything else"
              tone="default"
              tasks={other}
              countLabel="open"
            />
          )}
          {completed.length > 0 && (
            <TaskGroup
              title="Recently completed"
              tone="success"
              tasks={completed}
              countLabel="done"
              completed
            />
          )}
        </div>
      )}
    </AppShell>
  );
}

function TaskGroup({
  title,
  tone,
  tasks,
  countLabel,
  completed = false,
}: {
  title: string;
  tone: "default" | "destructive" | "warning" | "success";
  tasks: AssignedTaskWithContext[];
  countLabel: string;
  completed?: boolean;
}) {
  const toneClass = {
    default: "text-muted-foreground",
    destructive: "text-destructive",
    warning: "text-warning",
    success: "text-success",
  }[tone];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={cn("text-heading text-base font-semibold", toneClass)}>
          {title}
        </h2>
        <span className="text-overline text-muted-foreground tabular-nums">
          {tasks.length} {countLabel}
        </span>
      </div>
      <Card tone="subtle">
        <CardContent className="p-0">
          <ul className="divide-y divide-white/[0.04]">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} completed={completed} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function TaskRow({
  task,
  completed,
}: {
  task: AssignedTaskWithContext;
  completed: boolean;
}) {
  const overdueState = task.dueDate ? isOverdue(task.dueDate) : false;
  const dueSoonState =
    !overdueState &&
    task.dueDate !== undefined &&
    daysUntilDate(task.dueDate) <= 3;

  return (
    <Link
      href={`/events/${task.eventId}/actions`}
      className={cn(
        "group flex items-center gap-4 px-5 py-4 transition-colors",
        "hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      )}
    >
      {completed ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success whitespace-nowrap min-w-[88px] justify-center">
          <CheckCircle2 className="size-2.5" /> Done
        </span>
      ) : overdueState && task.dueDate ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive whitespace-nowrap min-w-[88px] justify-center">
          <AlertCircle className="size-2.5" /> Overdue
        </span>
      ) : dueSoonState && task.dueDate ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning whitespace-nowrap min-w-[88px] justify-center">
          <CalendarClock className="size-2.5" /> {formatDateShort(task.dueDate)}
        </span>
      ) : task.dueDate ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[88px] justify-center">
          <CalendarClock className="size-2.5" /> {formatDateShort(task.dueDate)}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[88px] justify-center">
          <Clock className="size-2.5" /> No date
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium truncate",
            completed
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {task.accountName ? `${task.accountName} · ` : ""}
          {task.eventName}
          {" · "}
          <span className="capitalize">{task.category}</span>
          {completed && task.completedAt && (
            <span> · {timeSince(task.completedAt)}</span>
          )}
        </p>
      </div>

      {task.priority === "critical" && !completed && (
        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive whitespace-nowrap">
          <AlertCircle className="size-2.5" /> Critical
        </span>
      )}
    </Link>
  );
}
