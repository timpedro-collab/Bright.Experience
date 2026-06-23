/**
 * The partner's book of business, rendered with real client names, deal
 * values and a single commission-status vocabulary — replacing the old
 * repeated "Date / Type / UUID / Commission" tables.
 */
import { Building2, FileText, PartyPopper } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatUSDFromCents } from "@/lib/currency";
import type { PartnerDeal, CommissionStatus } from "@/lib/queries/partner-attributions";

const STATUS: Record<
  CommissionStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Awaiting decision",
    className: "bg-warning/15 text-warning",
  },
  approved: {
    label: "Approved — payout due",
    className: "bg-[var(--color-bb-cobalt)]/15 text-[var(--color-bb-cobalt)]",
  },
  paid: {
    label: "Paid",
    className: "bg-success/15 text-success",
  },
  rejected: {
    label: "Not proceeding",
    className: "bg-muted text-muted-foreground",
  },
};

export function CommissionStatusPill({ status }: { status: CommissionStatus }) {
  const cfg = STATUS[status] ?? STATUS.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}

function eventTypeLabel(t?: string): string | null {
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function PartnerDealList({ deals }: { deals: PartnerDeal[] }) {
  return (
    <ul className="divide-y divide-border/50">
      {deals.map((deal) => {
        const type = eventTypeLabel(deal.eventType);
        return (
          <li
            key={deal.id}
            className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  deal.kind === "event"
                    ? "bg-success/10 text-success"
                    : "bg-[var(--color-bb-cobalt)]/10 text-[var(--color-bb-cobalt)]",
                )}
              >
                {deal.kind === "event" ? (
                  <PartyPopper className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {deal.clientName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {deal.dealName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {type && (
                    <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {type}
                    </span>
                  )}
                  <CommissionStatusPill status={deal.status} />
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {deal.commissionCents != null
                  ? formatUSDFromCents(deal.commissionCents)
                  : "—"}
              </p>
              <p className="text-[0.65rem] text-muted-foreground">commission</p>
              {deal.valueCents != null && (
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground tabular-nums">
                  {formatUSDFromCents(deal.valueCents)} deal
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
