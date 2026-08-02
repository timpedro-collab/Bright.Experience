/**
 * The show's dated spine: install, doors, close, collection.
 *
 * Rendered as one horizontal run rather than a list, because the question is
 * always "how long have I got" rather than "what is the date" — the countdown
 * is the number, the date is the reference.
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDateMedium } from "@/lib/dates";
import type { ScheduleEntry } from "@/lib/metrics/show-schedule";

interface KeyDatesProps {
  entries: ScheduleEntry[];
}

/** How far off a date is, phrased the way someone planning would say it. */
function proximity(entry: ScheduleEntry): string {
  if (entry.state === "today") return "Today";
  if (entry.daysAway === 1) return "Tomorrow";
  if (entry.daysAway === -1) return "Yesterday";
  if (entry.daysAway > 0) return `In ${entry.daysAway} days`;
  return `${Math.abs(entry.daysAway)} days ago`;
}

export function KeyDates({ entries }: KeyDatesProps) {
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 lg:grid-cols-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={cn(
              "border-l-2 pl-3",
              entry.state === "today"
                ? "border-[var(--color-bb-cobalt)]"
                : entry.state === "past"
                  ? "border-border/60"
                  : "border-border"
            )}
          >
            <p
              className={cn(
                "text-[0.65rem] uppercase tracking-wide",
                entry.state === "past"
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground"
              )}
            >
              {entry.label}
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm font-semibold",
                entry.state === "past"
                  ? "text-muted-foreground line-through decoration-1"
                  : "text-foreground"
              )}
            >
              {formatDateMedium(entry.date)}
            </p>
            <p className="text-[0.65rem] tabular-nums text-muted-foreground">
              {proximity(entry)}
            </p>
            {entry.hint && entry.state !== "past" && (
              <p className="mt-1 text-[0.65rem] text-muted-foreground/80">
                {entry.hint}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
