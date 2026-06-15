/** Single kanban card for an event in the pipeline board. */
import Link from "next/link";
import { HealthBadge } from "@/components/ui/StatusBadge";
import type { PipelineEvent } from "@/lib/queries/pipeline";
import { daysUntilDate } from "@/lib/dates";

function ownerInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function daysLabel(dateStr: string): string {
  const d = daysUntilDate(dateStr);
  if (d === 0) return "Today";
  if (d > 0) return `${d}d away`;
  return `${Math.abs(d)}d ago`;
}

export function PipelineCard({ event }: { event: PipelineEvent }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-lg border border-border/60 bg-card p-3.5 hover:border-border transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {event.name}
        </h3>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6rem] font-bold text-muted-foreground"
          title={event.ownerName ?? "Unassigned"}
        >
          {ownerInitials(event.ownerName)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2 truncate">
        {event.accountName}
      </p>
      <div className="flex items-center justify-between gap-2">
        <HealthBadge status={event.healthStatus} />
        <span className="text-overline text-muted-foreground tabular-nums whitespace-nowrap">
          {daysLabel(event.eventDateStart)}
        </span>
      </div>
    </Link>
  );
}
