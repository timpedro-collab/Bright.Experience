/** Timeline view of upcoming deadlines across tasks, assets, and milestones. */
import { Clock, AlertTriangle, CheckCircle2, FileImage, ListChecks, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateShort, formatDateByCertainty } from "@/lib/dates";
import { OwnerBadge } from "@/components/ui/OwnerBadge";
import type { DeadlineItem, DeadlineUrgency } from "@/lib/queries/deadlines";
import type { UserRole } from "@/types";

interface DeadlineTimelineProps {
  deadlines: DeadlineItem[];
  isInternal?: boolean;
  viewerRole?: UserRole;
}

const URGENCY_STYLES: Record<DeadlineUrgency, { dot: string; text: string; badge: string }> = {
  on_track: {
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  due_soon: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  overdue: {
    dot: "bg-destructive",
    text: "text-destructive",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

const URGENCY_LABELS: Record<DeadlineUrgency, string> = {
  on_track: "On track",
  due_soon: "Due soon",
  overdue: "Overdue",
};

function EntityIcon({ type }: { type: DeadlineItem["entityType"] }) {
  switch (type) {
    case "task":
      return <ListChecks size={12} />;
    case "asset":
      return <FileImage size={12} />;
    case "milestone":
      return <Flag size={12} />;
  }
}

function formatDueDate(dueDate: string, isInternal: boolean): string {
  return isInternal ? formatDateShort(dueDate) : formatDateByCertainty(dueDate);
}

export function DeadlineTimeline({ deadlines, isInternal = false, viewerRole }: DeadlineTimelineProps) {
  if (deadlines.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <CheckCircle2 size={16} className="text-success" />
        {isInternal
          ? "No pending deadlines on this event."
          : "Nothing on your plate right now — you're all clear."}
      </div>
    );
  }

  const overdue = deadlines.filter((d) => d.urgency === "overdue").length;
  const dueSoon = deadlines.filter((d) => d.urgency === "due_soon").length;

  return (
    <div className="space-y-4">
      {(overdue > 0 || dueSoon > 0) && (
        <div className="flex items-center gap-3 text-xs">
          {overdue > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle size={12} />
              {overdue} overdue
            </span>
          )}
          {dueSoon > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock size={12} />
              {dueSoon} due within 7 days
            </span>
          )}
        </div>
      )}

      <div className="relative space-y-0">
        {deadlines.map((d, idx) => {
          const styles = URGENCY_STYLES[d.urgency];
          return (
            <div key={`${d.entityType}-${d.id}`} className="relative flex gap-3 pb-4">
              {idx < deadlines.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[7px] top-5 bottom-0 w-px bg-border"
                />
              )}

              <span
                className={cn(
                  "relative z-10 mt-1.5 h-[14px] w-[14px] rounded-full border-2 shrink-0",
                  d.urgency === "overdue"
                    ? "border-destructive bg-destructive/20"
                    : d.urgency === "due_soon"
                      ? "border-amber-400 bg-amber-400/20"
                      : "border-emerald-400/60 bg-emerald-400/10"
                )}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {d.title}
                  </span>
                  {d.children && d.children.length > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      · {d.children.length} file{d.children.length === 1 ? "" : "s"}
                    </span>
                  )}
                  <OwnerBadge
                    owner={d.owner}
                    viewerRole={viewerRole}
                    isInternal={isInternal}
                  />
                  <Badge className={cn("text-[10px]", styles.badge)}>
                    {URGENCY_LABELS[d.urgency]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-muted-foreground border-border"
                  >
                    <EntityIcon type={d.entityType} />
                    <span className="ml-1 capitalize">{d.entityType}</span>
                  </Badge>
                </div>
                <p className={cn("text-xs mt-0.5", styles.text)}>
                  {formatDueDate(d.dueDate, isInternal)}
                </p>
                {d.children && d.children.length > 0 && (
                  <details className="group/details mt-2">
                    <summary className="cursor-pointer list-none text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline">
                      <span className="group-open/details:hidden">
                        Show {d.children.length} file{d.children.length === 1 ? "" : "s"}
                      </span>
                      <span className="hidden group-open/details:inline">Hide files</span>
                    </summary>
                    <ul className="mt-2 space-y-1.5 border-l border-border pl-3">
                      {d.children.map((child) => {
                        const childStyles = URGENCY_STYLES[child.urgency];
                        return (
                          <li
                            key={`${child.entityType}-${child.id}`}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-xs text-foreground truncate">
                              {child.title}
                            </span>
                            <span className={cn("text-[11px] shrink-0", childStyles.text)}>
                              {formatDueDate(child.dueDate, isInternal)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
