/** Shared event context bar shown above every event sub-page */
import Link from "next/link";
import {
  Calendar,
  MapPin,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

import { HealthBadge, StageBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDateMedium, daysUntilDate } from "@/lib/dates";
import type { Event } from "@/types";

interface EventContextBarProps {
  event: Event;
  currentSection: string;
}

export function EventContextBar({ event, currentSection }: EventContextBarProps) {
  const days = daysUntilDate(event.eventDateStart);
  const dateLabel = event.eventDateEnd
    ? `${formatDateMedium(event.eventDateStart)} – ${formatDateMedium(event.eventDateEnd)}`
    : formatDateMedium(event.eventDateStart);

  return (
    <div className="mb-6 rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,56%,11%,0.55)] backdrop-blur-md">
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex items-start gap-3 min-w-0">
          <Button asChild variant="ghost" size="icon-sm" className="mt-0.5 shrink-0">
            <Link href={`/events/${event.id}`} aria-label="Back to event overview">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-overline text-muted-foreground mb-0.5">
              {event.account.name}
            </p>
            <Link
              href={`/events/${event.id}`}
              className="block text-heading text-base font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {event.name}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground/80">{currentSection}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{dateLabel}</span>
            {days > 0 ? (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.625rem] font-medium tabular-nums text-primary">
                in {days}d
              </span>
            ) : days === 0 ? (
              <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[0.625rem] font-medium text-success">
                today
              </span>
            ) : null}
          </div>
          {event.venueName && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">{event.venueName}</span>
            </div>
          )}
          <StageBadge stage={event.currentStage} />
          <HealthBadge status={event.healthStatus} />
          {event.pipedriveDealId && (
            <Link
              href={pipedriveDealUrl(event.pipedriveDealId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.625rem] font-medium text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
              title="Open this deal in Pipedrive"
            >
              <span className="text-foreground/80">Pipedrive deal</span>
              <span className="font-semibold text-foreground">
                #{event.pipedriveDealId}
              </span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Build a deal URL from the configured base URL. Pipedrive's web app
 * URL is the API base URL minus the leading `api.` — there isn't a
 * better way to derive this without storing the org subdomain
 * separately. Falls back to a Pipedrive search if the convention
 * doesn't apply.
 */
function pipedriveDealUrl(dealId: string): string {
  const base =
    process.env.NEXT_PUBLIC_PIPEDRIVE_WEB_BASE_URL ??
    "https://app.pipedrive.com";
  return `${base}/deal/${dealId}`;
}
