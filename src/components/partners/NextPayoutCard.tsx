/**
 * "Next payout" — the question every reseller actually cares about: how much
 * is coming, and when. Approved commissions are confirmed and scheduled for
 * the next monthly run; pending sits behind them in the pipeline.
 */
import { Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateLong } from "@/lib/dates";

/** Bright.Blue pays approved commissions on the last business day of the month. */
function nextPayoutDate(now = new Date()): string {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return formatDateLong(iso);
}

export function NextPayoutCard({
  approvedCents,
  pendingCents,
  paidCents,
}: {
  approvedCents: number;
  pendingCents: number;
  paidCents: number;
}) {
  return (
    <Card className="bg-gradient-to-br from-[var(--color-bb-cobalt)] to-[#1230b8] text-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-white/80">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Next payout
          </span>
        </div>
        <p className="mt-3 text-4xl font-bold tabular-nums">
          {formatMoneyFromPence(approvedCents)}
        </p>
        <p className="mt-1 text-sm text-white/80">
          Lands {nextPayoutDate()}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
          <div>
            <p className="text-lg font-semibold tabular-nums">
              {formatMoneyFromPence(pendingCents)}
            </p>
            <p className="text-xs text-white/70">In pipeline</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums">
              {formatMoneyFromPence(paidCents)}
            </p>
            <p className="text-xs text-white/70">Paid to date</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
