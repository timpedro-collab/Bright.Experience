import Link from "next/link";
import {
  MapPin,
  Calendar,
  ArrowRight,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import type { Event } from "@/types";
import { STAGE_CONFIG } from "@/types";
import { HealthDot } from "@/components/ui/HealthIndicator";
import { StageBadge, EventHealthBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { formatDateMedium } from "@/lib/dates";
import { deriveEventHealth } from "@/lib/event-health";

function getStageProgress(stage: string): number {
  const order = STAGE_CONFIG[stage as keyof typeof STAGE_CONFIG]?.order ?? 0;
  return Math.round((order / 9) * 100);
}

export function EventCard({
  event,
  isInternal = false,
  actionsForViewer,
}: {
  event: Event;
  isInternal?: boolean;
  /**
   * Count of open tasks on the viewer's plate for this event. Drives the
   * pill in the card header — warning tone when > 0, muted "All clear"
   * when 0, hidden entirely when undefined (e.g. mock paths that don't
   * have task data plumbed through).
   */
  actionsForViewer?: number;
}) {
  const href = `/events/${event.id}`;
  const progress = getStageProgress(event.currentStage);
  // Derived from stage + dates so a date-passed event can never read as a
  // calm green dot. Wrapped events show a quiet success state.
  const chip = deriveEventHealth(event);

  return (
    <Link
      href={href}
      className={cn(
        "group block p-6 rounded-[var(--radius-card)] border bg-card text-card-foreground",
        "shadow-[var(--bb-shadow-card)] transition-all duration-200",
        "border-border hover:border-border hover:-translate-y-0.5 hover:shadow-[var(--bb-shadow-premium)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {chip.kind === "wrapped" ? (
            <CheckCircle2 size={14} className="text-success shrink-0" />
          ) : (
            <HealthDot status={chip.status} pulse size="md" />
          )}
          <div>
            <h3 className="text-heading text-base font-semibold text-foreground group-hover:text-brand transition-colors">
              {event.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {event.account.name}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          {actionsForViewer !== undefined && (
            <ActionsPill count={actionsForViewer} isInternal={isInternal} />
          )}
          <ArrowRight
            size={16}
            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <StageBadge stage={event.currentStage} isCustomer={!isInternal} />
        <EventHealthBadge event={event} isCustomer={!isInternal} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={14} className="text-muted-foreground shrink-0" />
          <span>
            {formatDateMedium(event.eventDateStart)}
            {event.eventDateEnd && ` – ${formatDateMedium(event.eventDateEnd)}`}
          </span>
        </div>
        {event.venueName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate">{event.venueName}</span>
          </div>
        )}
        {event.machineType && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor size={14} className="text-muted-foreground shrink-0" />
            <span>{event.machineType}</span>
          </div>
        )}
      </div>

      <ProgressBar value={progress} showLabel />
    </Link>
  );
}

/**
 * Pill that answers "is anything on me for this event?" at a glance.
 *
 * Internal viewer with > 0 work: warning tone, "{n} on you".
 * Customer viewer with > 0 work: warning tone, "{n} to do" — softer
 * phrasing because the customer's todo list lives next to a relaxed
 * "your portal" experience.
 * Zero work: small muted "All clear" pill so the absence of a number
 * still reads as a positive signal rather than missing data.
 */
function ActionsPill({
  count,
  isInternal,
}: {
  count: number;
  isInternal: boolean;
}) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/[0.07] px-2 py-0.5 text-[10px] font-medium text-success/90 whitespace-nowrap">
        <CheckCircle2 size={10} />
        All clear
      </span>
    );
  }
  const label = isInternal ? "on you" : "to do";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums whitespace-nowrap",
        "border-warning/30 bg-warning/[0.12] text-warning"
      )}
    >
      {count} {label}
    </span>
  );
}
