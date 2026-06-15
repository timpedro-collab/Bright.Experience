"use client";

/**
 * Interactive task checklist — grouped by overdue / active / completed.
 *
 * Both customers and internal users can mark tasks as complete via
 * `completeTask`. Internal users additionally see a "Skip" option
 * and can start pending tasks. The UI is optimistic — the check
 * toggles instantly while the server action resolves in the background.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  ArrowRight,
  User,
  SkipForward,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/ui/StatusBadge";
import { formatDateShort, isOverdue } from "@/lib/dates";
import { completeTask, skipTask, startTask } from "@/app/actions/tasks";
import { celebrateFromElement, celebrateBig } from "@/lib/celebrate";
import { useProgressToast } from "@/hooks/useProgressToast";
import { CelebrationCheck } from "@/components/ui/CelebrationCheck";
import { AllClearState } from "@/components/ui/AllClearState";

function priorityAccent(priority: string): string {
  switch (priority) {
    case "critical":
      return "border-l-destructive";
    case "high":
      return "border-l-warning";
    default:
      return "border-l-transparent";
  }
}

export function TaskChecklist({
  tasks,
  showInternalTasks = false,
  isInternal = false,
}: {
  tasks: Task[];
  showInternalTasks?: boolean;
  isInternal?: boolean;
}) {
  const visibleTasks = showInternalTasks
    ? tasks
    : tasks.filter((t) => t.customerVisible);

  const overdue = visibleTasks.filter(
    (t) =>
      t.status !== "complete" &&
      t.status !== "skipped" &&
      isOverdue(t.dueDate)
  );
  const active = visibleTasks.filter(
    (t) =>
      t.status !== "complete" &&
      t.status !== "skipped" &&
      !isOverdue(t.dueDate)
  );
  const completed = visibleTasks.filter(
    (t) => t.status === "complete" || t.status === "skipped"
  );
  const openCount = overdue.length + active.length;

  const totalTasks = visibleTasks.length;

  if (openCount === 0 && completed.length > 0) {
    return (
      <div className="space-y-6">
        <AllClearState variant="tasks" />
        <TaskGroup
          title="Completed"
          tasks={completed}
          variant="completed"
          isInternal={isInternal}
          openCount={openCount}
          totalTasks={totalTasks}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <TaskGroup
          title="Overdue"
          tasks={overdue}
          variant="overdue"
          isInternal={isInternal}
          openCount={openCount}
          totalTasks={totalTasks}
        />
      )}
      {active.length > 0 && (
        <TaskGroup
          title="In Progress & Upcoming"
          tasks={active}
          variant="active"
          isInternal={isInternal}
          openCount={openCount}
          totalTasks={totalTasks}
        />
      )}
      {completed.length > 0 && (
        <TaskGroup
          title="Completed"
          tasks={completed}
          variant="completed"
          isInternal={isInternal}
          openCount={openCount}
          totalTasks={totalTasks}
        />
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  variant,
  isInternal,
  openCount,
  totalTasks,
}: {
  title: string;
  tasks: Task[];
  variant: "overdue" | "active" | "completed";
  isInternal: boolean;
  openCount: number;
  totalTasks: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {variant === "overdue" && (
          <AlertCircle size={14} className="text-destructive" />
        )}
        {variant === "active" && (
          <ArrowRight size={14} className="text-brand" />
        )}
        {variant === "completed" && (
          <CheckCircle2 size={14} className="text-success" />
        )}
        <h3 className="text-overline text-muted-foreground">{title}</h3>
        <span className="text-overline text-muted-foreground">{tasks.length}</span>
      </div>

      <div className="space-y-2">
        {tasks.map((task, i) => (
          <TaskItem
            key={task.id}
            task={task}
            index={i}
            isCompleted={variant === "completed"}
            isInternal={isInternal}
            openCount={openCount}
            totalTasks={totalTasks}
          />
        ))}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  index,
  isCompleted,
  isInternal,
  openCount,
  totalTasks,
}: {
  task: Task;
  index: number;
  isCompleted: boolean;
  isInternal: boolean;
  openCount: number;
  totalTasks: number;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showProgress } = useProgressToast("tasks");
  const overdue = !isCompleted && task.dueDate && isOverdue(task.dueDate);

  function handleComplete(e?: React.MouseEvent) {
    const triggerEl = (e?.currentTarget as HTMLElement) ?? null;
    startTransition(async () => {
      const result = await completeTask(task.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const doneNow = totalTasks - openCount + 1;
      if (openCount <= 1) {
        celebrateBig();
      } else {
        celebrateFromElement(triggerEl);
      }
      showProgress(doneNow, totalTasks);
      router.refresh();
    });
  }

  function handleSkip() {
    startTransition(async () => {
      const result = await skipTask(task.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.info("Task skipped");
      router.refresh();
    });
  }

  function handleStart() {
    startTransition(async () => {
      const result = await startTask(task.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (task.targetPath) {
        router.push(`/events/${task.eventId}/${task.targetPath}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div
      className={`group rounded-[var(--radius-card)] border border-border/30 p-4 border-l-3 transition-all hover:bg-muted/10 ${priorityAccent(task.priority)} ${
        isCompleted ? "opacity-60" : ""
      }`}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {pending ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          ) : isCompleted ? (
            <CelebrationCheck size={18} className="text-success" />
          ) : task.status === "blocked" ? (
            <AlertCircle size={18} className="text-destructive" />
          ) : task.status === "in_progress" ? (
            <Clock size={18} className="text-brand" />
          ) : (
            <button
              onClick={handleComplete}
              className="hover:text-success transition-colors text-muted-foreground"
              title="Mark as complete"
            >
              <Circle size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            {task.targetPath ? (
              <Link
                href={`/events/${task.eventId}/${task.targetPath}`}
                className={`text-sm font-medium hover:underline ${
                  isCompleted
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {task.title}
              </Link>
            ) : (
              <p
                className={`text-sm font-medium ${
                  isCompleted
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {task.title}
              </p>
            )}
            <TaskStatusBadge status={task.status} />
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2">
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  overdue ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                <Clock size={11} />
                {overdue ? "Overdue: " : "Due: "}
                {formatDateShort(task.dueDate!)}
              </span>
            )}
            {task.assignedTo && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User size={11} />
                {task.assignedTo.name}
              </span>
            )}
            {task.isBlocking && (
              <Badge variant="destructive" className="text-[0.55rem]">
                Blocking
              </Badge>
            )}
          </div>

          {!isCompleted && !pending && (
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {task.status !== "in_progress" &&
                task.status !== "complete" &&
                task.status !== "skipped" && (
                  <Button
                    variant="brand"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleComplete}
                  >
                    <CheckCircle2 size={12} /> Complete
                  </Button>
                )}
              {task.status === "in_progress" && (
                <Button
                  variant="brand"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleComplete}
                >
                  <CheckCircle2 size={12} /> Done
                </Button>
              )}
              {task.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleStart}
                >
                  <ArrowRight size={12} /> Start
                </Button>
              )}
              {isInternal && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={handleSkip}
                >
                  <SkipForward size={12} /> Skip
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
