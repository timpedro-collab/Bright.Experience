/** Grouped list of inbox tasks with a tone-coloured section header. */

import { cn } from "@/lib/utils";
import type { AssignedTaskWithContext } from "@/lib/queries/tasks";
import { TaskRow } from "./TaskRow";

/** Renders one urgency bucket (overdue / due soon / open / done). */
export function TaskGroup({
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

  const accentClass = {
    default: "text-[var(--color-bb-cobalt)]",
    destructive: "text-destructive",
    warning: "text-warning",
    success: "text-success",
  }[tone];

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className={cn("text-overline", accentClass)}>{title}</h2>
        <span className="text-overline text-muted-foreground tabular-nums">
          {tasks.length} {countLabel}
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskRow task={task} completed={completed} toneClass={toneClass} />
          </li>
        ))}
      </ul>
    </section>
  );
}
