/**
 * PortfolioStrip — a slim, scannable rail of events for the focused home.
 *
 * Demoted secondary context under "What needs you now": a horizontal row of
 * compact event cards (name, account, stage + health, open-task count). Keeps
 * the portfolio one glance away without the old full-page library grid.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HealthBadge, StageBadge } from "@/components/ui/StatusBadge";
import { EventProgressRing } from "@/components/dashboard/EventProgressRing";
import { formatDateMedium } from "@/lib/dates";
import type { Event, Stage } from "@/types";

interface PortfolioStripProps {
  title: string;
  subtitle?: string;
  events: Event[];
  taskCounts: Record<string, number>;
  taskProgress: Record<string, { completed: number; total: number }>;
  /** Where "see all" links to. */
  seeAllHref?: string;
  seeAllLabel?: string;
}

export function PortfolioStrip({
  title,
  subtitle,
  events,
  taskCounts,
  taskProgress,
  seeAllHref = "/pipeline",
  seeAllLabel = "Open pipeline",
}: PortfolioStripProps) {
  if (events.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          {seeAllLabel} <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {events.map((event) => {
          const open = taskCounts[event.id] ?? 0;
          const progress = taskProgress[event.id];
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group w-[260px] shrink-0 snap-start rounded-2xl border border-border/70 bg-card p-4 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--bb-shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {event.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {event.account.name} · {formatDateMedium(event.eventDateStart)}
                  </p>
                </div>
                {progress && progress.total > 0 && (
                  <EventProgressRing
                    completed={progress.completed}
                    total={progress.total}
                    size={34}
                    strokeWidth={3}
                  />
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StageBadge stage={event.currentStage as Stage} />
                <HealthBadge status={event.healthStatus} />
              </div>

              {open > 0 && (
                <p className="mt-3 text-xs font-medium text-primary">
                  {open} task{open === 1 ? "" : "s"} on you
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
