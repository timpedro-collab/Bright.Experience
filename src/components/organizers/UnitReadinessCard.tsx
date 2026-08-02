/**
 * Is this unit ready? — the pre-show replacement for a zeroed scoreboard.
 *
 * Rows are ordered by the checklist, not by status, so the page doesn't
 * reshuffle every time something is ticked off. What each row leads with is
 * the state and who owns it: an organizer scanning this should be able to
 * tell in one pass which lines are theirs to clear and which are ours.
 */

import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Clock,
  MinusCircle,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  readinessProgress,
  readinessHeadline,
  type ReadinessItem,
  type ReadinessState,
} from "@/lib/metrics/unit-readiness";

interface UnitReadinessCardProps {
  items: ReadinessItem[];
  /** Line under the headline, e.g. the countdown to the doors opening. */
  timingHint?: string;
}

const STATE_ICON: Record<ReadinessState, React.ElementType> = {
  done: CheckCircle2,
  todo: CircleAlert,
  waiting: Clock,
  optional: MinusCircle,
};

const STATE_COLOR: Record<ReadinessState, string> = {
  done: "text-success",
  todo: "text-warning",
  waiting: "text-muted-foreground",
  optional: "text-muted-foreground/50",
};

/** Only the organizer's own outstanding items are worth a call to action. */
const STATE_NOTE: Record<ReadinessState, string | null> = {
  done: null,
  todo: "Needs you",
  waiting: "With Bright.Blue",
  optional: null,
};

export function UnitReadinessCard({ items, timingHint }: UnitReadinessCardProps) {
  const progress = readinessProgress(items);
  const percent =
    progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-heading text-sm font-semibold text-foreground">
            {readinessHeadline(progress)}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {progress.done} of {progress.total} ready
          </p>
        </div>
        {timingHint && (
          <p className="mt-1 text-xs text-muted-foreground">{timingHint}</p>
        )}

        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Unit readiness"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              progress.isReady ? "bg-success" : "bg-[var(--color-bb-cobalt)]"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        <ul className="mt-4 divide-y divide-border/50">
          {items.map((item) => {
            const Icon = STATE_ICON[item.state];
            const note = STATE_NOTE[item.state];
            return (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <Icon
                  size={14}
                  className={cn("mt-0.5 shrink-0", STATE_COLOR[item.state])}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    {note && (
                      <span
                        className={cn(
                          "text-[0.65rem] uppercase tracking-wide",
                          item.state === "todo"
                            ? "text-warning"
                            : "text-muted-foreground"
                        )}
                      >
                        {note}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                  {item.href && item.state === "todo" && (
                    <Link
                      href={item.href}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
                    >
                      Sort this out <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
