/** ProposalBreakdown — line items table plus optional proposal notes */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGBP } from "@/lib/roi";

export interface ProposalLineItem {
  id: string;
  label: string;
  amount: number;
  category?: string;
  sort_order: number;
}

interface ProposalBreakdownProps {
  lineItems: ProposalLineItem[];
  totalPence: number;
  notes?: string | null;
}

export function ProposalBreakdown({
  lineItems,
  totalPence,
  notes,
}: ProposalBreakdownProps) {
  const sorted = [...lineItems].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card tone="subtle">
      <CardHeader className="px-10 pt-10 pb-3 md:px-12 md:pt-12 print-break-inside-avoid">
        <p className="text-overline text-muted-foreground mb-1">What's included</p>
        <CardTitle className="text-2xl">Investment breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-10 pb-10 md:px-12 md:pb-12">
        <div className="overflow-hidden rounded-[var(--radius-control)] border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] print:table-header-group">
              <tr className="text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-white/[0.04] print-break-inside-avoid"
                >
                  <td className="px-5 py-4 text-foreground">{item.label}</td>
                  <td className="px-5 py-4 text-muted-foreground capitalize">
                    {item.category ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right text-foreground tabular-nums">
                    {formatGBP(item.amount / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.1] bg-primary/[0.04] print-break-inside-avoid">
                <td
                  colSpan={2}
                  className="px-5 py-4 text-right text-sm font-semibold text-foreground"
                >
                  Total
                </td>
                <td className="px-5 py-4 text-right text-2xl font-bold text-primary tabular-nums">
                  {formatGBP(totalPence / 100)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {notes && (
          <div className="rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-overline text-muted-foreground mb-2">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
              {notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
