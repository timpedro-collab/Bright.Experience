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
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  suspended: { label: "Suspended", className: "bg-red-500/10 text-red-400 border-red-500/20" },
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
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] p-16 text-center">
        <p className="text-sm text-text-muted">No partner applications yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06] hover:bg-transparent">
            <TableHead className="text-text-muted">Company</TableHead>
            <TableHead className="text-text-muted">Type</TableHead>
            <TableHead className="text-text-muted">Code</TableHead>
            <TableHead className="text-text-muted">Contact</TableHead>
            <TableHead className="text-text-muted">Status</TableHead>
            <TableHead className="text-right text-text-muted">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((p) => {
            const id = String(p.id);
            const status = String(p.status ?? "pending");
            const statusConfig = STATUS_MAP[status] ?? STATUS_MAP.pending;

            return (
              <TableRow key={id} className="border-white/[0.06]">
                <TableCell className="font-medium text-text-primary">
                  {String(p.company_name ?? p.name ?? "—")}
                </TableCell>
                <TableCell className="text-text-secondary capitalize">
                  {String(p.partner_type ?? "referral")}
                </TableCell>
                <TableCell>
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-brand">
                    {String(p.code ?? "—")}
                  </code>
                </TableCell>
                <TableCell className="text-text-secondary text-sm">
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
                      className="text-text-muted hover:text-text-primary"
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
                        className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
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
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
