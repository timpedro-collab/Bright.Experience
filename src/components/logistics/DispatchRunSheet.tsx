/**
 * Ops dispatch run-sheet — the one card an ops lead glances at before a job.
 *
 * Consolidates the key dispatch facts (venue, key dates, on-site contacts, and
 * confirmation status of each logistics leg) from data we already hold, so ops
 * doesn't have to scan the full timeline to know if the job is dispatch-ready.
 */
import {
  MapPin,
  CalendarDays,
  Truck,
  Package,
  ArrowDownToLine,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";

import { GlassCard } from "@/components/cloud";
import { formatDateMedium } from "@/lib/dates";
import type { Event, LogisticsEntry } from "@/types";

const LEG_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  delivery: { label: "Delivery", icon: Truck },
  setup: { label: "Setup", icon: Package },
  collection: { label: "Collection", icon: ArrowDownToLine },
};

function legStatusTone(status: LogisticsEntry["status"]) {
  if (status === "completed" || status === "confirmed")
    return { icon: CheckCircle2, className: "text-success" };
  if (status === "issue")
    return { icon: AlertTriangle, className: "text-destructive" };
  return { icon: Clock, className: "text-muted-foreground" };
}

export function DispatchRunSheet({
  event,
  entries,
}: {
  event: Event;
  entries: LogisticsEntry[];
}) {
  const legs = (["delivery", "setup", "collection"] as const)
    .map((type) => ({
      type,
      entry: entries.find((e) => e.entryType === type),
    }))
    .filter((l) => l.entry);

  const confirmed = entries.filter(
    (e) => e.status === "confirmed" || e.status === "completed",
  ).length;
  const issues = entries.filter((e) => e.status === "issue").length;

  const dispatchReady =
    legs.length > 0 && confirmed === entries.length && issues === 0;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Dispatch run-sheet</h3>
        </div>
        <span
          className={
            dispatchReady
              ? "inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success"
              : issues > 0
                ? "inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive"
                : "inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-warning"
          }
        >
          {dispatchReady
            ? "Dispatch ready"
            : issues > 0
              ? `${issues} issue${issues === 1 ? "" : "s"}`
              : `${confirmed}/${entries.length} confirmed`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="block font-medium text-foreground">
                {event.venueName ?? "Venue TBC"}
              </span>
              {event.venueAddress && (
                <span className="block text-xs text-muted-foreground">
                  {event.venueAddress}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-sm">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground">
              <KeyDate label="Setup" value={event.setupDate} />
              <KeyDate
                label="Event"
                value={event.eventDateStart}
                end={event.eventDateEnd}
              />
              <KeyDate label="Collection" value={event.collectionDate} />
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {legs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No dispatch legs scheduled yet.
            </p>
          ) : (
            legs.map(({ type, entry }) => {
              const meta = LEG_META[type];
              const LegIcon = meta.icon;
              const tone = legStatusTone(entry!.status);
              const StatusIcon = tone.icon;
              return (
                <div
                  key={type}
                  className="flex items-center gap-3 rounded-xl border border-border/40 px-3 py-2"
                >
                  <LegIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {meta.label}
                      {entry!.scheduledDate
                        ? ` · ${formatDateMedium(entry!.scheduledDate)}`
                        : ""}
                      {entry!.scheduledTime ? ` ${entry!.scheduledTime}` : ""}
                    </span>
                    {(entry!.contactName || entry!.contactPhone) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="size-3" />
                        {entry!.contactName}
                        {entry!.contactPhone ? ` · ${entry!.contactPhone}` : ""}
                      </span>
                    )}
                  </div>
                  <StatusIcon className={`size-4 shrink-0 ${tone.className}`} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function KeyDate({
  label,
  value,
  end,
}: {
  label: string;
  value?: string;
  end?: string;
}) {
  if (!value) return null;
  return (
    <span className="block text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground">
        {formatDateMedium(value)}
        {end ? ` – ${formatDateMedium(end)}` : ""}
      </span>
    </span>
  );
}
