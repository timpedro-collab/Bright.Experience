/** Vertical timeline of logistics entries (delivery, setup, collection) */
"use client";

import { useState } from "react";
import { Truck, Package, ArrowDownToLine, MoreHorizontal, MapPin, Phone, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateLogisticsEntry } from "@/app/actions/logistics";
import type { LogisticsEntry, LogisticsStatus } from "@/types";

const STATUS_STYLES: Record<LogisticsStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted/40 text-muted-foreground border-muted-foreground/20" },
  confirmed: { label: "Confirmed", className: "bg-brand/12 text-brand border-brand/25" },
  in_transit: { label: "In Transit", className: "bg-warning/12 text-warning border-warning/25" },
  completed: { label: "Completed", className: "bg-success/12 text-success border-success/25" },
  issue: { label: "Issue", className: "bg-destructive/12 text-destructive border-destructive/25" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  delivery: Truck,
  setup: Package,
  collection: ArrowDownToLine,
  other: MoreHorizontal,
};

interface LogisticsTimelineProps {
  eventId: string;
  entries: LogisticsEntry[];
  isInternal: boolean;
}

export function LogisticsTimeline({ entries, isInternal }: LogisticsTimelineProps) {
  return (
    <div className="relative space-y-0">
      {entries.length > 1 && (
        <div className="absolute left-6 top-8 bottom-8 w-px bg-border" />
      )}
      {entries.map((entry, i) => (
        <LogisticsCard key={entry.id} entry={entry} index={i} isInternal={isInternal} />
      ))}
    </div>
  );
}

function LogisticsCard({ entry, index, isInternal }: {
  entry: LogisticsEntry;
  index: number;
  isInternal: boolean;
}) {
  const [updating, setUpdating] = useState(false);
  const Icon = TYPE_ICONS[entry.entryType] || MoreHorizontal;
  const statusStyle = STATUS_STYLES[entry.status];

  async function handleStatusChange(newStatus: LogisticsStatus) {
    setUpdating(true);
    try {
      await updateLogisticsEntry(entry.id, { status: newStatus });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div
      className="relative flex gap-4 pb-6 stagger-item"
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className={cn(
        "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border",
        entry.status === "completed"
          ? "bg-success/10 border-success/20"
          : "bg-card-dark border-border"
      )}>
        <Icon size={20} className={entry.status === "completed" ? "text-success" : "text-muted-foreground"} />
      </div>

      <Card className="flex-1 p-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
          <span className={cn(
            "inline-flex items-center rounded-[var(--radius-chip)] border px-2 py-0.5 text-[0.625rem] font-semibold uppercase",
            statusStyle.className
          )}>
            {statusStyle.label}
          </span>
        </div>

        {entry.description && (
          <p className="text-xs text-muted-foreground mb-3">{entry.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {entry.scheduledDate && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {entry.scheduledDate}
              {entry.scheduledTime && ` at ${entry.scheduledTime}`}
            </span>
          )}
          {entry.contactName && (
            <span className="flex items-center gap-1">
              <Phone size={12} /> {entry.contactName}
              {entry.contactPhone && ` (${entry.contactPhone})`}
            </span>
          )}
          {entry.trackingReference && (
            <span className="flex items-center gap-1">
              <Hash size={12} /> {entry.trackingReference}
            </span>
          )}
        </div>

        {entry.notes && (
          <p className="text-xs text-muted-foreground mt-2 italic">{entry.notes}</p>
        )}

        {isInternal && entry.status !== "completed" && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            {entry.status === "pending" && (
              <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatusChange("confirmed")}>
                Confirm
              </Button>
            )}
            {entry.status === "confirmed" && (
              <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatusChange("in_transit")}>
                Mark In Transit
              </Button>
            )}
            {(entry.status === "in_transit" || entry.status === "confirmed") && (
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange("completed")}>
                Complete
              </Button>
            )}
            <Button size="sm" variant="destructive" disabled={updating} onClick={() => handleStatusChange("issue")}>
              Flag Issue
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
