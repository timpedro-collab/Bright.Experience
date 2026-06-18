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

import type { Task, UserRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/ui/StatusBadge";
import { formatDateShort, isOverdue } from "@/lib/dates";
import { completeTask, skipTask, startTask } from "@/app/actions/tasks";
import { celebrateFromElement, celebrateBig } from "@/lib/celebrate";
import { useProgressToast } from "@/hooks/useProgressToast";
import { CelebrationCheck } from "@/components/ui/CelebrationCheck";
import { AllClearState } from "@/components/ui/AllClearState";
import { ownerForTask, ownerLabelFor, OWNER_DISPLAY_LABEL } from "@/lib/ownership";
import { taskInputGate } from "@/lib/task-input";

/**
 * Short owner badge for a task — the single most important signal for
 * "is this on me?". Customers see "On you" for their own actions and who
 * they're waiting on otherwise; internal staff see "On you" only when the
 * task is theirs, and "On the customer" for customer actions.
 */
function ownerBadgeLabel(
  task: Task,
  isInternal: boolean,
  viewerRole?: UserRole
): string {
  const owner = ownerForTask(task);
  if (owner === "customer") {
    return isInternal ? "On the customer" : "On you";
  }
  if (!isInternal) {
    return `With ${OWNER_DISPLAY_LABEL[owner]}`;
  }
  if (viewerRole && ownerLabelFor(owner, viewerRole) === "Waiting on you") {
    return "On you";
  }
  return `With ${OWNER_DISPLAY_LABEL[owner]}`;
}

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
  viewerRole,
}: {
  tasks: Task[];
  showInternalTasks?: boolean;
  isInternal?: boolean;
  viewerRole?: UserRole;
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
        <AllClearState
          variant="tasks"
          description={
            isInternal
              ? "Every task here is complete. Nothing outstanding on this list."
              : undefined
          }
        />
        <TaskGroup
          title="Completed"
          tasks={completed}
          variant="completed"
          isInternal={isInternal}
          viewerRole={viewerRole}
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
          viewerRole={viewerRole}
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
          viewerRole={viewerRole}
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
          viewerRole={viewerRole}
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
  viewerRole,
  openCount,
  totalTasks,
}: {
  title: string;
  tasks: Task[];
  variant: "overdue" | "active" | "completed";
  isInternal: boolean;
  viewerRole?: UserRole;
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
            viewerRole={viewerRole}
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
  viewerRole,
  openCount,
  totalTasks,
}: {
  task: Task;
  index: number;
  isCompleted: boolean;
  isInternal: boolean;
  viewerRole?: UserRole;
  openCount: number;
  totalTasks: number;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showProgress } = useProgressToast("tasks");
  const overdue = !isCompleted && task.dueDate && isOverdue(task.dueDate);
  // Internal staff completing a customer's task act explicitly on the
  // customer's behalf — the server enforces this and audits it.
  const customerTaskAsInternal =
    isInternal && task.taskType === "customer_action";
  const ownerLabel = ownerBadgeLabel(task, isInternal, viewerRole);
  const ownedByViewer = ownerLabel === "On you";
  // Tasks backed by a real input (upload / form / setup) complete when that
  // input is submitted — so we route the owner there instead of offering a
  // free manual tick that would cross the item off with nothing supplied.
  const gate = taskInputGate(task);
  const targetHref = task.targetPath
    ? `/events/${task.eventId}/${task.targetPath}`
    : undefined;

  function handleComplete(e?: React.MouseEvent) {
    const triggerEl = (e?.currentTarget as HTMLElement) ?? null;
    startTransition(async () => {
      const result = await completeTask(task.id, customerTaskAsInternal);
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
          ) : customerTaskAsInternal || gate ? (
            // Gated tasks (and customer tasks viewed by internal staff) have no
            // free manual tick — completion follows the actual submission.
            <Circle size={18} className="text-muted-foreground/50" />
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
            {!isCompleted && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-medium ${
                  ownedByViewer
                    ? "bg-[var(--color-bb-cobalt)]/15 text-[var(--color-bb-cobalt)]"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {ownerLabel}
              </span>
            )}
          </div>

          {!isCompleted && !pending && gate && (
            // Submission-gated: send the owner to the input that actually
            // completes the task. No free manual tick — the CTA is always
            // visible so it's obvious where to go.
            <div className="mt-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {targetHref && (
                  <Button
                    asChild
                    variant={ownedByViewer ? "brand" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <Link href={targetHref}>
                      {ownedByViewer ? gate.cta : "Open to review"}
                      <ArrowRight size={12} />
                    </Link>
                  </Button>
                )}
                {customerTaskAsInternal && (
                  // Escape hatch: internal staff can complete on the customer's
                  // behalf — explicit + audited.
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={handleComplete}
                    title="Only if the customer asked you to — logged against your name"
                  >
                    <CheckCircle2 size={12} /> Mark done for customer
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
              {ownedByViewer && (
                <p className="text-[0.7rem] text-muted-foreground">{gate.hint}</p>
              )}
            </div>
          )}

          {!isCompleted && !pending && !gate && (
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {customerTaskAsInternal ? (
                // Internal staff act on the customer's behalf — explicit + audited.
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleComplete}
                  title="Only if the customer asked you to — logged against your name"
                >
                  <CheckCircle2 size={12} /> Mark done for customer
                </Button>
              ) : (
                <>
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
                </>
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
