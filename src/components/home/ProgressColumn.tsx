/**
 * The "Progress" column on the customer featured-event spread — shows the
 * current stage plus the next two, with a link to the full schedule.
 */
import Link from "next/link";

import { getProgressRows } from "@/components/home/home-helpers";
import type { Event } from "@/types";

export function ProgressColumn({ event }: { event: Event }) {
  const rows = getProgressRows(event);

  return (
    <div className="p-6 space-y-4">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This event is wrapped. Final reports will be in your inbox shortly.
        </p>
      ) : (
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-3 border-b border-border/40 py-3 last:border-0"
            >
              <span
                className={
                  row.active
                    ? "text-sm text-foreground font-medium leading-snug"
                    : "text-sm text-muted-foreground leading-snug"
                }
              >
                {row.label}
              </span>
              <span
                className={
                  row.active
                    ? "text-overline text-[var(--color-bb-cobalt)] whitespace-nowrap"
                    : "text-overline text-muted-foreground whitespace-nowrap"
                }
              >
                {row.status}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/events/${event.id}/deadlines`}
        className="inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
      >
        Open the full schedule →
      </Link>
    </div>
  );
}
