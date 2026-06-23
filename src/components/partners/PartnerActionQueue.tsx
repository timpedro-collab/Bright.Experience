/**
 * "Needs your attention" — the reseller's answer to *what's awaiting me right
 * now*. Surfaces open quotes to chase and freshly-approved commissions, so the
 * partner always lands on a clear next action rather than a wall of tables.
 */
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSDFromCents } from "@/lib/currency";
import type { PartnerDeal } from "@/lib/queries/partner-attributions";

interface ActionItem {
  id: string;
  icon: typeof Clock;
  title: string;
  detail: string;
}

export function PartnerActionQueue({
  deals,
  quotesHref,
}: {
  deals: PartnerDeal[];
  quotesHref: string;
}) {
  const openQuotes = deals.filter(
    (d) => d.kind === "quote" && d.status === "pending",
  );
  const approved = deals.filter((d) => d.status === "approved");

  const items: ActionItem[] = [
    ...openQuotes.map((d) => ({
      id: d.id,
      icon: Clock,
      title: `Follow up with ${d.clientName}`,
      detail: d.valueCents
        ? `Proposal out for ${formatUSDFromCents(d.valueCents)} — awaiting their decision.`
        : "Proposal sent — awaiting their decision.",
    })),
    ...approved.map((d) => ({
      id: `${d.id}-payout`,
      icon: Wallet,
      title: `${d.clientName} commission approved`,
      detail: d.commissionCents
        ? `${formatUSDFromCents(d.commissionCents)} confirmed and scheduled for your next payout.`
        : "Confirmed and scheduled for your next payout.",
    })),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Needs your attention</span>
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
            You&apos;re all caught up — nothing needs chasing right now.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-[var(--radius-control)] border border-border/60 bg-muted/30 p-3"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bb-cobalt)]/10 text-[var(--color-bb-cobalt)]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {openQuotes.length > 0 && (
          <Link
            href={quotesHref}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
          >
            Manage your quote pipeline <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
