/**
 * The rate card at a glance: the five products as prospectus-style rows.
 * Suggested retail bands only — splits and floors live on the private
 * partner-pricing page, never in the kit.
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRetailBand, PRODUCT_FAMILY } from "@/lib/informa/products";

export function RateCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-card/50 hover:bg-card/50">
            <TableHead>Product</TableHead>
            <TableHead>Rate-card line</TableHead>
            <TableHead>Suggested retail</TableHead>
            <TableHead className="text-right">Buyer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PRODUCT_FAMILY.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-semibold">{p.name}</TableCell>
              <TableCell className="text-muted-foreground">{p.descriptor}</TableCell>
              <TableCell className="tabular-nums">{formatRetailBand(p)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{p.buyer}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t border-border/70 bg-card/30 px-4 py-3 text-xs text-muted-foreground">
        Bands are suggested retail; the price is yours to set per show and per
        placement. Every product ships with delivery, on-site operation and the
        24 hour proof-of-performance report included.
      </p>
    </div>
  );
}
