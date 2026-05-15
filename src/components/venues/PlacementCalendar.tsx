/** Timeline view of machine placements at a venue, colour-coded by status. */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlacementEntry {
  id: string;
  startDate: string;
  endDate?: string;
  status: string;
  machineName?: string;
}

interface PlacementCalendarProps {
  placements: PlacementEntry[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  planned: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Planned" },
  active: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Active" },
  completed: { bg: "bg-zinc-500/20", text: "text-zinc-400", label: "Completed" },
  cancelled: { bg: "bg-red-500/20", text: "text-red-400", label: "Cancelled" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export function PlacementCalendar({ placements }: PlacementCalendarProps) {
  if (placements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No placements scheduled yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...placements].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const earliest = new Date(sorted[0].startDate).getTime();
  const latest = sorted.reduce((max, p) => {
    const end = p.endDate
      ? new Date(p.endDate).getTime()
      : new Date(p.startDate).getTime() + 30 * 86_400_000;
    return Math.max(max, end);
  }, earliest);
  const totalDays = Math.max(1, Math.ceil((latest - earliest) / 86_400_000));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Placement Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((placement) => {
          const style = STATUS_STYLES[placement.status] ?? STATUS_STYLES.planned;
          const startOffset = daysBetween(
            new Date(earliest).toISOString(),
            placement.startDate
          );
          const duration = placement.endDate
            ? daysBetween(placement.startDate, placement.endDate)
            : 30;
          const leftPct = (startOffset / totalDays) * 100;
          const widthPct = Math.min((duration / totalDays) * 100, 100 - leftPct);

          return (
            <div key={placement.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {placement.machineName ?? "Unassigned Machine"}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", style.text)}
                >
                  {style.label}
                </Badge>
              </div>

              <div className="relative h-6 w-full rounded-md bg-muted/30 overflow-hidden">
                <div
                  className={cn("absolute top-0 h-full rounded-md", style.bg)}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDate(placement.startDate)}</span>
                <span>
                  {placement.endDate
                    ? formatDate(placement.endDate)
                    : "Ongoing"}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
