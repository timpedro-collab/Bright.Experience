/** Sortable partner table with approve/suspend actions for internal users */
"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Ban, Eye } from "lucide-react";
import { approvePartner, suspendPartner } from "@/app/actions/partners";
import Link from "next/link";

interface AdminPartnerTableProps {
  partners: Record<string, unknown>[];
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success/15 text-success border-success/30" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  suspended: { label: "Suspended", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function AdminPartnerTable({ partners }: AdminPartnerTableProps) {
  const [acting, setActing] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setActing(id);
    await approvePartner(id);
    setActing(null);
  }

  async function handleSuspend(id: string) {
    setActing(id);
    await suspendPartner(id);
    setActing(null);
  }

  if (partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-16 text-center">
        <p className="text-sm text-muted-foreground">No partner applications yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Company</TableHead>
            <TableHead className="text-muted-foreground">Type</TableHead>
            <TableHead className="text-muted-foreground">Code</TableHead>
            <TableHead className="text-muted-foreground">Contact</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((p) => {
            const id = String(p.id);
            const status = String(p.status ?? "pending");
            const statusConfig = STATUS_MAP[status] ?? STATUS_MAP.pending;

            return (
              <TableRow key={id} className="border-border/60">
                <TableCell className="font-medium text-foreground">
                  {String(p.company_name ?? p.name ?? "—")}
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {String(p.type ?? "referral")}
                </TableCell>
                <TableCell>
                  <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-xs text-brand">
                    {String(p.partner_code ?? "—")}
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {String(p.contact_email ?? "—")}
                </TableCell>
                <TableCell>
                  <Badge className={cn("border", statusConfig.className)}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Link href={`/admin/partners/${id}`}>
                        <Eye size={14} className="mr-1" />
                        View
                      </Link>
                    </Button>
                    {status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(id)}
                        disabled={acting === id}
                        className="bg-success/15 text-success hover:bg-success/25 border border-success/30"
                      >
                        <CheckCircle2 size={14} className="mr-1" />
                        Approve
                      </Button>
                    )}
                    {status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSuspend(id)}
                        disabled={acting === id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Ban size={14} className="mr-1" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
