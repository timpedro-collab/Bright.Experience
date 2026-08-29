/** Single inbox task row linking through to the event actions surface. */

import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Clock,
} from "lucide-react";

import { daysUntilDate, formatDateShort, isOverdue } from "@/lib/dates";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { cn } from "@/lib/utils";
import type { AssignedTaskWithContext } from "@/lib/queries/tasks";

/** One assigned task with due-date tone and event context. */
export function TaskRow({
  task,
  completed,
  toneClass,
}: {
  task: AssignedTaskWithContext;
  completed: boolean;
  toneClass: string;
}) {
  const overdueState = task.dueDate ? isOverdue(task.dueDate) : false;
  const dueSoonState =
    !overdueState &&
    task.dueDate !== undefined &&
    daysUntilDate(task.dueDate) <= 3;

  return (
    <Link
      href={task.targetPath ? `/events/${task.eventId}/${task.targetPath}` : `/events/${task.eventId}/actions`}
      className={cn(
        "group relative flex items-start gap-4 py-3.5 pl-3 pr-2 text-left transition-colors",
        "hover:bg-accent/30 focus-visible:outline-none focus-visible:bg-accent/40",
      )}
    >
      {/* Left edge stripe: tone for open, transparent for completed. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-2 bottom-2 w-[2px] rounded-full",
          completed
            ? "bg-transparent"
            : overdueState
              ? "bg-destructive"
              : dueSoonState
                ? "bg-warning"
                : "bg-primary/40",
        )}
      />

      {/* Status pill / glyph */}
      <span
        className={cn(
          "inline-flex h-7 min-w-[88px] shrink-0 items-center justify-center gap-1 rounded-md border px-2 text-[10px] font-semibold whitespace-nowrap mt-0.5",
          completed
            ? "border-success/30 bg-success/10 text-success"
            : overdueState && task.dueDate
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : dueSoonState && task.dueDate
                ? "border-warning/30 bg-warning/10 text-warning"
                : task.dueDate
                  ? "border-border/60 bg-card/40 text-muted-foreground"
                  : "border-border/60 bg-card/40 text-muted-foreground",
        )}
      >
        {completed ? (
          <>
            <CheckCircle2 className="size-2.5" /> Done
          </>
        ) : overdueState && task.dueDate ? (
          <>
            <AlertCircle className="size-2.5" /> Overdue
          </>
        ) : dueSoonState && task.dueDate ? (
          <>
            <CalendarClock className="size-2.5" /> {formatDateShort(task.dueDate)}
          </>
        ) : task.dueDate ? (
          <>
            <CalendarClock className="size-2.5" /> {formatDateShort(task.dueDate)}
          </>
        ) : (
          <>
            <Clock className="size-2.5" /> No date
          </>
        )}
      </span>

      {/* Title + context */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium truncate",
            completed
              ? "text-muted-foreground line-through"
              : "text-foreground",
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 text-overline text-muted-foreground truncate">
          {task.accountName ? `${task.accountName} · ` : ""}
          {task.eventName}
          <span className="opacity-60"> · </span>
          <span className="capitalize">{task.category}</span>
          {completed && task.completedAt && (
            <>
              <span className="opacity-60"> · </span>
              <TimeAgo dateStr={task.completedAt} />
            </>
          )}
        </p>
      </div>

      {/* Critical marker */}
      {task.priority === "critical" && !completed && (
        <span className="inline-flex items-center gap-1 text-overline text-destructive whitespace-nowrap shrink-0 mt-1">
          <AlertCircle className="size-3" /> Critical
        </span>
      )}

      {/* Tone hint badge (used only when no other badges showed) */}
      <span className={cn("sr-only", toneClass)}>{task.category}</span>
    </Link>
  );
}
