/**
 * The "Your other events" rail under the customer featured-event spread —
 * a compact grid of the customer's remaining editions.
 */
import Link from "next/link";

import { EditionPlate, Hairline } from "@/components/brand";
import { Pagination } from "@/components/ui/Pagination";
import { healthLabel } from "@/components/home/home-helpers";
import type { Event } from "@/types";

interface OtherEventsRailProps {
  events: Event[];
  taskCounts: Record<string, number>;
  taskProgress: Record<string, { completed: number; total: number }>;
  totalPages: number;
  page: number;
}

export function OtherEventsRail({
  events,
  taskCounts,
  taskProgress,
  totalPages,
  page,
}: OtherEventsRailProps) {
  return (
    <section className="py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Your other events
        </h2>
        <Link
          href="/"
          className="text-overline text-muted-foreground hover:text-foreground transition-colors"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.slice(0, 6).map((event) => {
          const health = healthLabel(event);
          return (
            <EditionPlate
              key={event.id}
              id={event.id}
              title={event.name}
              meta={event.venueName ?? undefined}
              statusLabel={health.label}
              statusTone={health.tone}
              waitingOnYou={(taskCounts[event.id] ?? 0) > 0}
              completedTasks={taskProgress[event.id]?.completed}
              totalTasks={taskProgress[event.id]?.total}
              href={`/events/${event.id}`}
            />
          );
        })}
      </div>
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
      )}
      <Hairline className="opacity-60 mt-10" />
    </section>
  );
}
