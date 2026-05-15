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
import { StageBadge, HealthBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { formatDateMedium } from "@/lib/dates";

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

  return (
    <Link
      href={href}
      className="card card-interactive group block p-6 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <HealthDot status={event.healthStatus} pulse size="md" />
          <div>
            <h3 className="text-heading text-base font-semibold text-text-primary group-hover:text-brand transition-colors">
              {event.name}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
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
            className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <StageBadge stage={event.currentStage} />
        <HealthBadge status={event.healthStatus} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Calendar size={14} className="text-text-muted shrink-0" />
          <span>
            {formatDateMedium(event.eventDateStart)}
            {event.eventDateEnd && ` – ${formatDateMedium(event.eventDateEnd)}`}
          </span>
        </div>
        {event.venueName && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <MapPin size={14} className="text-text-muted shrink-0" />
            <span className="truncate">{event.venueName}</span>
          </div>
        )}
        {event.machineType && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Monitor size={14} className="text-text-muted shrink-0" />
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
