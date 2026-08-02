/**
 * Every unit at a show and what each still needs.
 *
 * The fleet board answers "where are my machines"; this answers "what is
 * stopping them opening". Units the organizer owes something on sort first,
 * and each row names the outstanding items rather than showing a bare count —
 * "zone, sponsor artwork" tells them whether it's a two-minute job, and a
 * progress figure never does.
 */

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  showReadinessSummary,
  showReadinessLine,
  type ShowReadinessRow,
} from "@/lib/metrics/show-readiness";

interface ShowReadinessBoardProps {
  rows: ShowReadinessRow[];
  /** Base path for a unit page; the machine id is appended. */
  machineHrefBase: string;
  /** Line under the headline, usually the countdown to the doors. */
  timingHint?: string;
}

export function ShowReadinessBoard({
  rows,
  machineHrefBase,
  timingHint,
}: ShowReadinessBoardProps) {
  if (rows.length === 0) return null;

  const summary = showReadinessSummary(rows);
  const percent =
    summary.units === 0 ? 0 : Math.round((summary.ready / summary.units) * 100);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-heading text-sm font-semibold text-foreground">
            {showReadinessLine(summary)}
          </p>
          {timingHint && (
            <p className="text-xs text-muted-foreground">{timingHint}</p>
          )}
        </div>

        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Units ready"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              summary.ready === summary.units
                ? "bg-success"
                : "bg-[var(--color-bb-cobalt)]"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        <ul className="mt-4 divide-y divide-border/50">
          {rows.map((row) => (
            <li
              key={row.machine.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`${machineHrefBase}/${row.machine.id}`}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {row.machine.label}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.machine.zone ?? "No zone yet"}
                  {row.organizerTodo.length > 0
                    ? ` · needs ${row.organizerTodo
                        .map((item) => item.label.toLowerCase())
                        .join(", ")}`
                    : row.waitingOnUs.length > 0
                      ? ` · with Bright.Blue: ${row.waitingOnUs
                          .map((item) => item.label.toLowerCase())
                          .join(", ")}`
                      : ""}
                </p>
              </div>
              {row.isReady ? (
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 size={13} /> Ready
                </span>
              ) : (
                <Link
                  href={`${machineHrefBase}/${row.machine.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
                >
                  {row.done} of {row.total} <ArrowRight size={11} />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
