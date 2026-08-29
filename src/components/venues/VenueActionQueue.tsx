/**
 * "Awaiting you" for the venue operator — the open sponsorship slots worth
 * money and the placements still missing a machine. One clear queue instead
 * of hunting across calendar, board and runway.
 */
import Link from "next/link";
import { ArrowRight, CheckCircle2, Monitor, Ticket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateGB, formatDateRangeGB } from "@/lib/dates";

export interface VenueActionItem {
  id: string;
  kind: "slot" | "placement";
  title: string;
  detail: string;
  valueCents?: number;
}

function ActionRow({
  href,
  Icon,
  title,
  detail,
  valueCents,
}: {
  href: string;
  Icon: typeof Ticket;
  title: string;
  detail: string;
  valueCents?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-[var(--radius-control)] border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-accent/50"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-tertiary">{detail}</p>
      </div>
      {valueCents != null && (
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatMoneyFromPence(valueCents)}
        </span>
      )}
      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
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
  // Open sponsorship slots are commercially identical — a list of seven
  // "Open sponsorship slot" rows is noise. Collapse them into one revenue
  // summary; genuine per-placement obligations (missing a machine) stay as
  // their own rows.
  const slots = items.filter((i) => i.kind === "slot");
  const placements = items.filter((i) => i.kind !== "slot");
  const groupSlots = slots.length >= 2;
  const slotValue = slots.reduce((sum, s) => sum + (s.valueCents ?? 0), 0);
  const displayCount = (groupSlots ? 1 : slots.length) + placements.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Awaiting you</span>
          {displayCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {displayCount}
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
            {groupSlots ? (
              <li>
                <ActionRow
                  href={sponsorshipsHref}
                  Icon={Ticket}
                  title={`${slots.length} open sponsorship slots`}
                  detail="Invite sponsors to fill them and unlock this revenue"
                  valueCents={slotValue > 0 ? slotValue : undefined}
                />
              </li>
            ) : (
              slots.map((item) => (
                <li key={item.id}>
                  <ActionRow
                    href={sponsorshipsHref}
                    Icon={Ticket}
                    title={item.title}
                    detail={item.detail}
                    valueCents={item.valueCents}
                  />
                </li>
              ))
            )}
            {placements.map((item) => (
              <li key={item.id}>
                <ActionRow
                  href={placementsHref}
                  Icon={Monitor}
                  title={item.title}
                  detail={item.detail}
                  valueCents={item.valueCents}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Convenience formatter used by callers when building detail strings. */
export function slotWindow(start: string, end: string | null): string {
  return end ? formatDateRangeGB(start, end) : formatDateGB(start);
}
