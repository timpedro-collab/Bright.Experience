import { Check, Circle, Clock, ArrowRight, AlertTriangle } from "lucide-react";
import type { Milestone, Task, UserRole } from "@/types";
import { formatDateShort, isOverdue } from "@/lib/dates";
import { ownerForMilestone, ownerLabelFor } from "@/lib/ownership";

export function MilestoneTimeline({
  milestones,
  compact = false,
  tasks,
  viewerRole,
}: {
  milestones: Milestone[];
  compact?: boolean;
  /** Optional — when supplied, "Waiting on …" pills appear on active milestones. */
  tasks?: Task[];
  viewerRole?: UserRole;
}) {
  return (
    <div className="relative">
      {milestones.map((milestone, index) => {
        const isLast = index === milestones.length - 1;
        const isComplete = milestone.status === "complete";
        const isActive = milestone.status === "in_progress";
        const isPending = milestone.status === "pending";
        const isMissed =
          !isComplete &&
          milestone.status !== "skipped" &&
          isOverdue(milestone.targetDate);

        const owner =
          tasks && !isComplete ? ownerForMilestone(milestone.id, tasks) : null;
        const waitingLabel =
          owner && viewerRole ? ownerLabelFor(owner, viewerRole) : null;

        return (
          <div
            key={milestone.id}
            className="relative flex gap-4"
            style={
              {
                "--stagger-index": index,
              } as React.CSSProperties
            }
          >
            {/* Vertical line */}
            {!isLast && (
              <div
                className={`absolute left-[15px] top-[32px] w-[2px] ${
                  isComplete
                    ? "bg-success/30"
                    : isActive
                      ? "bg-gradient-to-b from-brand/30 to-border"
                      : "bg-border"
                }`}
                style={{ bottom: compact ? "-4px" : "-8px" }}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 shrink-0 mt-1">
              {isComplete ? (
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-success/15 ring-2 ring-success/20">
                  <Check size={14} className="text-success" />
                </div>
              ) : isMissed ? (
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-warning/15 ring-2 ring-warning/30">
                  <AlertTriangle size={14} className="text-warning" />
                </div>
              ) : isActive ? (
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand/15 ring-2 ring-brand/30">
                  <ArrowRight size={14} className="text-brand" />
                </div>
              ) : (
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-muted/40 ring-2 ring-border">
                  <Circle size={10} className="text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
            <div
              className={`flex-1 ${compact ? "pb-5" : "pb-7"} ${
                isPending ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-brand"
                        : isComplete
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {milestone.name}
                  </p>
                  {!compact && milestone.targetDate && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {isComplete && milestone.completedAt
                          ? `Completed ${formatDateShort(milestone.completedAt!)}`
                          : `Target: ${formatDateShort(milestone.targetDate!)}`}
                      </span>
                    </div>
                  )}
                </div>

                {compact && milestone.targetDate && (
                  <span className="text-overline text-muted-foreground tabular-nums">
                    {formatDateShort(milestone.targetDate!)}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {isMissed && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-medium leading-none text-warning">
                    <AlertTriangle size={10} /> Missed
                  </span>
                )}
                {waitingLabel && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${
                      waitingLabel === "Waiting on you"
                        ? "border border-warning/30 bg-warning/10 text-warning"
                        : "border border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {waitingLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
