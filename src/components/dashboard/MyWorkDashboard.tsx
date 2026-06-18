/** Role-aware work dashboard — shows open tasks grouped by event. */
"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { formatDateShort, formatDateMedium, isOverdue, daysUntilDate } from "@/lib/dates";
import type { TaskGroupByEvent } from "@/lib/queries/tasks";
import type { UserRole } from "@/types";

interface MyWorkDashboardProps {
  taskGroups: TaskGroupByEvent[];
  role: UserRole;
}

const DUE_SOON_DAYS = 3;

export function MyWorkDashboard({ taskGroups, role }: MyWorkDashboardProps) {
  const totalTasks = taskGroups.reduce((n, g) => n + g.tasks.length, 0);
  const totalEvents = taskGroups.length;

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <p className="text-base font-medium text-foreground">
          You&apos;re all caught up. No items waiting for you.
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          When new work lands on your role, it&apos;ll appear here
          automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-card)] border border-border/40 bg-card/50 px-5 py-4">
        <p className="text-sm text-foreground">
          You have{" "}
          <span className="font-semibold tabular-nums">{totalTasks}</span>{" "}
          item{totalTasks === 1 ? "" : "s"} across{" "}
          <span className="font-semibold tabular-nums">{totalEvents}</span>{" "}
          event{totalEvents === 1 ? "" : "s"}.
        </p>
      </div>

      {taskGroups.map((group) => (
        <EventTaskGroup key={group.eventId} group={group} />
      ))}
    </div>
  );
}

function EventTaskGroup({ group }: { group: TaskGroupByEvent }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border/30 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/20 bg-card/30 px-5 py-3">
        <div className="min-w-0">
          <Link
            href={`/events/${group.eventId}`}
            className="text-sm font-medium text-foreground hover:underline underline-offset-4 truncate block"
          >
            {group.eventName}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            {group.accountName} · {formatDateMedium(group.eventDate)}
          </p>
        </div>
        <HealthBadge status={group.healthStatus as "green" | "amber" | "red"} />
      </div>

      <ul className="divide-y divide-border/20">
        {group.tasks.map((task) => {
          const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
          const dueSoon =
            !overdue &&
            task.dueDate !== undefined &&
            daysUntilDate(task.dueDate) <= DUE_SOON_DAYS;
          const href = task.targetPath
            ? `/events/${group.eventId}/${task.targetPath}`
            : `/events/${group.eventId}/actions`;

          return (
            <li key={task.id}>
              <Link
                href={href}
                className={cn(
                  "group flex items-center gap-4 px-5 py-3 transition-colors",
                  "hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.priority === "critical" && (
                    <Badge variant="destructive" className="text-[0.55rem]">
                      <AlertCircle className="size-2.5 mr-0.5" /> Critical
                    </Badge>
                  )}
                  {task.priority === "high" && (
                    <Badge variant="outline" className="text-[0.55rem] border-warning/40 text-warning">
                      High
                    </Badge>
                  )}
                  <DueChip dueDate={task.dueDate} overdue={overdue} dueSoon={dueSoon} />
                  <ArrowRight className="size-3.5 text-muted-foreground/60 transition-colors group-hover:text-foreground" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DueChip({
  dueDate,
  overdue,
  dueSoon,
}: {
  dueDate?: string;
  overdue: boolean;
  dueSoon: boolean;
}) {
  if (overdue && dueDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive whitespace-nowrap">
        <AlertCircle className="size-2.5" /> Overdue
      </span>
    );
  }
  if (dueSoon && dueDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning whitespace-nowrap">
        <CalendarClock className="size-2.5" /> {formatDateShort(dueDate)}
      </span>
    );
  }
  if (dueDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
        <CalendarClock className="size-2.5" /> {formatDateShort(dueDate)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
      <Clock className="size-2.5" /> No date
    </span>
  );
}
