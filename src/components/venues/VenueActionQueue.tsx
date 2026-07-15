/**
 * "Awaiting you" for the venue operator — the open sponsorship slots worth
 * money and the placements still missing a machine. One clear queue instead
 * of hunting across calendar, board and runway.
 */
import Link from "next/link";
import { ArrowRight, CheckCircle2, Monitor, Ticket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";

export interface VenueActionItem {
  id: string;
  kind: "slot" | "placement";
  title: string;
  detail: string;
  valueCents?: number;
}

export function VenueActionQueue({
  items,
  sponsorshipsHref,
  placementsHref,
}: {
  items: VenueActionItem[];
  sponsorshipsHref: string;
  placementsHref: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Awaiting you</span>
          {items.length > 0 && (
            <span className="rounded-full bg-[var(--color-bb-cobalt)] px-2 py-0.5 text-xs font-semibold text-white">
              {items.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Every slot is filled and every placement is set — nothing needs you
            right now.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item) => {
              const Icon = item.kind === "slot" ? Ticket : Monitor;
              const href =
                item.kind === "slot" ? sponsorshipsHref : placementsHref;
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    className="group flex items-start gap-3 rounded-[var(--radius-control)] border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-accent"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bb-cobalt)]/10 text-[var(--color-bb-cobalt)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    {item.valueCents != null && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatMoneyFromPence(item.valueCents)}
                      </span>
                    )}
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Convenience formatter used by callers when building detail strings. */
export function slotWindow(start: string, end: string | null): string {
  return end
    ? `${formatDateShort(start)} – ${formatDateShort(end)}`
    : formatDateShort(start);
}
