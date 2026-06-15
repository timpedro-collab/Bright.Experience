/** Compact stat component used in venue dashboard KPI bars. */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COMPACT_TONES: Record<
  "default" | "success" | "warning" | "info",
  string
> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

/** Single inline KPI stat with icon, label, and coloured value. */
export function CompactStat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "info";
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-muted-foreground" />
      <div>
        <p className="text-overline text-muted-foreground leading-none">{label}</p>
        <p className={`mt-1 text-xl font-semibold tabular-nums leading-none ${COMPACT_TONES[tone]}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

/** Labelled detail row with icon — used in venue detail cards. */
export function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon size={14} />
        {label}
      </span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

/** Venue details summary card showing address, type, and capacity. */
export function VenueDetailsCard({
  venue,
  icons,
}: {
  venue: {
    address: string | null;
    postcode: string | null;
    venue_type: string | null;
    capacity: number | null;
  };
  icons: { mapPin: React.ElementType; building: React.ElementType; sparkles: React.ElementType; ticket: React.ElementType };
}) {
  return (
    <Card tone="subtle">
      <CardHeader className="pb-3">
        <CardTitle>Venue details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <DetailRow icon={icons.mapPin} label="Address" value={venue.address || "—"} />
        <DetailRow icon={icons.building} label="Postcode" value={venue.postcode || "—"} />
        <DetailRow
          icon={icons.sparkles}
          label="Type"
          value={
            <Badge variant="outline" className="text-[10px]">
              {venue.venue_type ? venue.venue_type.replace(/_/g, " ") : "Other"}
            </Badge>
          }
        />
        <DetailRow
          icon={icons.ticket}
          label="Capacity"
          value={venue.capacity ? venue.capacity.toLocaleString() : "—"}
        />
      </CardContent>
    </Card>
  );
}
