/** Dark-day gap list — one-click to open idle days for sponsorship. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateGB, formatDateRangeGB } from "@/lib/dates";
import { totalDarkDays, type DarkDayGap } from "@/lib/venues/dark-days";
import { createSponsorshipSlot } from "@/app/actions/venues";

export interface DarkDayPlacement {
  placementId: string;
  label: string;
  windowStart: string;
  windowEnd: string | null;
  gaps: DarkDayGap[];
  suggestedPricePounds?: number;
}

function gapKey(placementId: string, gap: DarkDayGap) {
  return `${placementId}:${gap.start}:${gap.end}`;
}

function formatGapRange(gap: DarkDayGap) {
  if (gap.start === gap.end) return formatDateGB(gap.start);
  return formatDateRangeGB(gap.start, gap.end);
}

export function DarkDayBoard({ placements }: { placements: DarkDayPlacement[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  function handleOpen(
    placementId: string,
    gap: DarkDayGap,
    suggestedPricePounds?: number,
  ) {
    const key = gapKey(placementId, gap);
    setOpeningKey(key);
    startTransition(async () => {
      const result = await createSponsorshipSlot({
        placementId,
        startDate: gap.start,
        endDate: gap.end,
        price: suggestedPricePounds,
      });
      setOpeningKey(null);
      if (result.success) {
        toast.success("Gap opened — it's on the market");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {placements.map((p) => {
        const darkTotal = totalDarkDays(p.gaps);
        return (
          <Card key={p.placementId}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-medium">{p.label}</CardTitle>
              {darkTotal === 0 ? (
                <span className="text-xs text-muted-foreground">Fully covered</span>
              ) : (
                <Badge variant="muted">{darkTotal} dark days</Badge>
              )}
            </CardHeader>
            {p.gaps.length > 0 && (
              <CardContent>
                <ul className="divide-y divide-border/50">
                  {p.gaps.map((gap) => {
                    const key = gapKey(p.placementId, gap);
                    const pending = isPending && openingKey === key;
                    return (
                      <li
                        key={key}
                        data-testid="dark-gap"
                        className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {formatGapRange(gap)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {gap.days} day{gap.days === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="brand"
                          disabled={pending}
                          onClick={() =>
                            handleOpen(p.placementId, gap, p.suggestedPricePounds)
                          }
                        >
                          {pending ? "Opening…" : "Open for sponsorship"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
