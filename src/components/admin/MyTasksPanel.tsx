/**
 * MyTasksPanel — dashboard surface for internal users.
 *
 * Shows up to 8 open tasks assigned to the current user, grouped by
 * urgency (overdue first, then due-soon, then everything else). The
 * goal is "what should I do next, across every event I touch" without
 * needing to bounce between event workspaces.
 *
 * Power-user route lives at `/inbox` (linked via See all).
 */
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Inbox,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  daysUntilDate,
  formatDateShort,
  isOverdue,
} from "@/lib/dates";
import type { AssignedTaskWithContext } from "@/lib/queries/tasks";

interface MyTasksPanelProps {
  tasks: AssignedTaskWithContext[];
  totalCount: number;
}

const MAX_VISIBLE = 8;
const DUE_SOON_THRESHOLD_DAYS = 3;

function priorityLevel(task: AssignedTaskWithContext): 0 | 1 | 2 {
  if (task.dueDate && isOverdue(task.dueDate)) return 0;
  if (task.dueDate && daysUntilDate(task.dueDate) <= DUE_SOON_THRESHOLD_DAYS) {
    return 1;
  }
  return 2;
}

export function MyTasksPanel({ tasks, totalCount }: MyTasksPanelProps) {
  const sorted = [...tasks].sort((a, b) => {
    const pa = priorityLevel(a);
    const pb = priorityLevel(b);
    if (pa !== pb) return pa - pb;
    // Stable secondary sort: due date asc (no-date last), then title.
    const da = a.dueDate ?? "9999-12-31";
    const db = b.dueDate ?? "9999-12-31";
    if (da !== db) return da.localeCompare(db);
    return a.title.localeCompare(b.title);
  });

  const visible = sorted.slice(0, MAX_VISIBLE);
  const hiddenCount = Math.max(0, totalCount - visible.length);

  return (
    <Card tone="subtle" className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-3">
            <Inbox className="size-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-overline text-muted-foreground">My tasks</p>
              <p className="text-sm font-medium text-foreground">
                {totalCount === 0
                  ? "No tasks on your plate"
                  : `${totalCount} open task${totalCount === 1 ? "" : "s"} across events`}
              </p>
            </div>
          </div>
          {totalCount > 0 && (
            <Link
              href="/inbox"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See all <ArrowRight className="size-3" />
            </Link>
          )}
        </div>

        {totalCount === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
            <CheckCircle2 className="size-6 text-success" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              Inbox zero across every event.
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              When work lands on you, it&apos;ll show up here in priority order.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} />
              </li>
            ))}
            {hiddenCount > 0 && (
              <li className="flex items-center justify-between bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
                <span>
                  + {hiddenCount} more open task{hiddenCount === 1 ? "" : "s"}
                </span>
                <Link
                  href="/inbox"
                  className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Open inbox <ArrowRight className="size-3" />
                </Link>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({ task }: { task: AssignedTaskWithContext }) {
  const overdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const dueSoon =
    !overdue &&
    task.dueDate !== undefined &&
    daysUntilDate(task.dueDate) <= DUE_SOON_THRESHOLD_DAYS;

  return (
    <Link
      href={`/events/${task.eventId}/actions`}
      className={cn(
        "group flex items-center gap-4 px-5 py-3 transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      )}
    >
      <DueChip dueDate={task.dueDate} overdue={overdue} dueSoon={dueSoon} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {task.title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {task.accountName ? `${task.accountName} · ` : ""}
          {task.eventName}
        </p>
      </div>
      {task.priority === "critical" && (
        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive whitespace-nowrap">
          <AlertCircle className="size-2.5" /> Critical
        </span>
      )}
      <ArrowRight className="size-3.5 text-muted-foreground/60 shrink-0 transition-colors group-hover:text-foreground" />
    </Link>
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
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive whitespace-nowrap min-w-[78px] justify-center">
        <AlertCircle className="size-2.5" /> Overdue
      </span>
    );
  }
  if (dueSoon && dueDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning whitespace-nowrap min-w-[78px] justify-center">
        <CalendarClock className="size-2.5" /> {formatDateShort(dueDate)}
      </span>
    );
  }
  if (dueDate) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[78px] justify-center">
        <CalendarClock className="size-2.5" /> {formatDateShort(dueDate)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[78px] justify-center">
      <Clock className="size-2.5" /> No date
    </span>
  );
}
