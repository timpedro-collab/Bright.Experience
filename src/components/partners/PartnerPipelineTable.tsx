/** Partner attribution pipeline table with status indicators */
"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, CalendarCheck } from "lucide-react";

interface Attribution {
  id: string;
  quoteId?: string;
  eventId?: string;
  commissionAmount?: number;
  commissionStatus: string;
  createdAt: string;
}

interface PartnerPipelineTableProps {
  attributions: Attribution[];
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  paid: { label: "Paid", className: "bg-brand/10 text-brand border-brand/20" },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

/** Formats a number as ZAR currency */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PartnerPipelineTable({ attributions }: PartnerPipelineTableProps) {
  if (attributions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-12 text-center">
        <FileText size={32} className="mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No attributions yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Share your partner link to start building your pipeline
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Date</TableHead>
            <TableHead className="text-muted-foreground">Type</TableHead>
            <TableHead className="text-muted-foreground">Commission</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attributions.map((attr) => {
            const isQuote = Boolean(attr.quoteId);
            const statusConfig = STATUS_MAP[attr.commissionStatus] ?? STATUS_MAP.pending;

            return (
              <TableRow key={attr.id} className="border-border/60">
                <TableCell className="text-muted-foreground">
                  {new Date(attr.createdAt).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 text-foreground">
                    {isQuote ? (
                      <FileText size={14} className="text-violet-400" />
                    ) : (
                      <CalendarCheck size={14} className="text-sky-400" />
                    )}
                    {isQuote ? "Quote" : "Event"}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-foreground">
                  {attr.commissionAmount != null
                    ? formatCurrency(attr.commissionAmount)
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge className={cn("border", statusConfig.className)}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
