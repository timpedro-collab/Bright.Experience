/**
 * CustomerEventBody — the shared single-column body for the customer's event
 * overview AND home featured event, so both surfaces answer the same four
 * questions in the same order:
 *
 *   1. What's on me?      → OverToYou (fused action block)
 *   2. What's the journey? → EventJourney variant="steps"
 *   3. Who's my team?      → YourTeamWidget + request button
 *   4. The proof/details?  → quiet CollapsibleSection disclosures
 *
 * No KPI grid and no right rail live here — the numbers move into a calm
 * lower-zone disclosure so the action block is never competing for attention.
 * Pure presentation: the page fetches everything and passes it in.
 */
import {
  Calendar,
  MapPin,
  Monitor,
  Package as PackageIcon,
} from "lucide-react";

import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { MetricRow } from "@/components/events/MetricRow";
import { OverToYou } from "@/components/events/OverToYou";
import { EventJourney } from "@/components/events/EventJourney";
import { YourTeamWidget } from "@/components/events/YourTeamWidget";
import { TeamRequestButton } from "@/components/events/TeamRequestButton";
import { nextCustomerMilestone } from "@/lib/journey";
import { formatDateLong } from "@/lib/dates";
import type {
  Event,
  EventTeamMember,
  Milestone,
} from "@/types";
import type { CustomerActionItem } from "@/lib/queries/deadlines";
import type { NextStep } from "@/lib/event-next-step";

interface CustomerEventBodyProps {
  eventId: string;
  event: Event;
  milestones: Milestone[];
  items: CustomerActionItem[];
  nextStep: NextStep | null;
  teamMembers: EventTeamMember[];
  /**
   * Overview-only "The numbers" disclosure. Omitted on the home surface so we
   * don't trigger extra fetches there.
   */
  metrics?: {
    daysToEvent: number;
    delivered: boolean;
    pendingActions: number;
    approvalsPending: number;
    missedMilestones: number;
  };
}

export function CustomerEventBody({
  eventId,
  event,
  milestones,
  items,
  nextStep,
  teamMembers,
  metrics,
}: CustomerEventBodyProps) {
  const nextUp = nextCustomerMilestone(event.currentStage, milestones);

  return (
    <div className="space-y-6 py-6">
      <OverToYou
        eventId={eventId}
        items={items}
        nextStep={nextStep}
        nextUp={nextUp}
      />

      <EventJourney
        eventId={eventId}
        currentStage={event.currentStage}
        milestones={milestones}
        variant="steps"
      />

      <div className="space-y-3">
        <YourTeamWidget eventId={eventId} members={teamMembers} />
        <TeamRequestButton eventId={eventId} />
      </div>

      <div className="space-y-3">
        <CollapsibleSection title="Event details">
          <EventDetails event={event} />
        </CollapsibleSection>

        {metrics && (
          <CollapsibleSection title="The numbers">
            <ul className="divide-y divide-border/60">
              <MetricRow
                label="Days to event"
                value={
                  metrics.delivered
                    ? "Wrapped"
                    : metrics.daysToEvent > 0
                      ? `${metrics.daysToEvent}d`
                      : metrics.daysToEvent === 0
                        ? "Today"
                        : "Live"
                }
              />
              <MetricRow
                label="Pending actions"
                value={String(metrics.pendingActions)}
                tone={metrics.pendingActions > 0 ? "default" : "muted"}
              />
              <MetricRow
                label="Approvals pending"
                value={String(metrics.approvalsPending)}
                tone={metrics.approvalsPending > 0 ? "default" : "muted"}
              />
              <MetricRow
                label="Missed milestones"
                value={String(metrics.missedMilestones)}
                tone={metrics.missedMilestones > 0 ? "warning" : "muted"}
              />
            </ul>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

/** Reused event facts — date, venue, package, machine. */
function EventDetails({ event }: { event: Event }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      <DetailItem
        icon={Calendar}
        label="Event date"
        value={
          event.eventDateEnd
            ? `${formatDateLong(event.eventDateStart)} → ${formatDateLong(event.eventDateEnd)}`
            : formatDateLong(event.eventDateStart)
        }
      />
      {event.venueName && (
        <DetailItem
          icon={MapPin}
          label="Venue"
          value={`${event.venueName}${event.venueAddress ? `, ${event.venueAddress}` : ""}`}
        />
      )}
      <DetailItem
        icon={PackageIcon}
        label="Package"
        value={`${event.packageType.charAt(0).toUpperCase()}${event.packageType.slice(1)} · ${event.eventType}`}
      />
      {event.machineType && (
        <DetailItem icon={Monitor} label="Machine" value={event.machineType} />
      )}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-overline text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm text-foreground leading-snug">{value}</p>
      </div>
    </div>
  );
}
