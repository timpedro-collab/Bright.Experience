"use client";

import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  ArrowRight,
  User,
} from "lucide-react";
import type { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/ui/StatusBadge";
import { formatDateShort, isOverdue } from "@/lib/dates";

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
}: {
  tasks: Task[];
  showInternalTasks?: boolean;
}) {
  const visibleTasks = showInternalTasks
    ? tasks
    : tasks.filter((t) => t.customerVisible);

  const overdue = visibleTasks.filter(
    (t) => t.status !== "complete" && t.status !== "skipped" && isOverdue(t.dueDate)
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

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <TaskGroup title="Overdue" tasks={overdue} variant="overdue" />
      )}
      {active.length > 0 && (
        <TaskGroup title="In Progress & Upcoming" tasks={active} variant="active" />
      )}
      {completed.length > 0 && (
        <TaskGroup title="Completed" tasks={completed} variant="completed" />
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  variant,
}: {
  title: string;
  tasks: Task[];
  variant: "overdue" | "active" | "completed";
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
        <h3 className="text-overline text-text-secondary">{title}</h3>
        <span className="text-overline text-text-muted">{tasks.length}</span>
      </div>

      <div className="space-y-2">
        {tasks.map((task, i) => (
          <TaskItem
            key={task.id}
            task={task}
            index={i}
            isCompleted={variant === "completed"}
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
}: {
  task: Task;
  index: number;
  isCompleted: boolean;
}) {
  const overdue =
    !isCompleted && task.dueDate && isOverdue(task.dueDate);

  return (
    <div
      className={`group glass-subtle rounded-[var(--radius-card)] p-4 border-l-3 transition-all hover:bg-white/[0.03] ${priorityAccent(task.priority)} ${
        isCompleted ? "opacity-60" : ""
      }`}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {isCompleted ? (
            <CheckCircle2 size={18} className="text-success" />
          ) : task.status === "blocked" ? (
            <AlertCircle size={18} className="text-destructive" />
          ) : task.status === "in_progress" ? (
            <Clock size={18} className="text-brand" />
          ) : (
            <Circle size={18} className="text-text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p
              className={`text-sm font-medium ${
                isCompleted
                  ? "text-text-secondary line-through"
                  : "text-text-primary"
              }`}
            >
              {task.title}
            </p>
            <TaskStatusBadge status={task.status} />
          </div>

          {task.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2">
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  overdue ? "text-destructive" : "text-text-muted"
                }`}
              >
                <Clock size={11} />
                {overdue ? "Overdue: " : "Due: "}
                {formatDateShort(task.dueDate!)}
              </span>
            )}
            {task.assignedTo && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <User size={11} />
                {task.assignedTo.name}
              </span>
            )}
            {task.isBlocking && (
              <Badge variant="destructive" className="text-[0.55rem]">Blocking</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
