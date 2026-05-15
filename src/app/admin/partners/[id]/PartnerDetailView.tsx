/** Partner detail view with info cards, attributions, and commission actions */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Ban,
  DollarSign,
  Building2,
  Mail,
  Globe,
  Copy,
} from "lucide-react";
import {
  approvePartner,
  suspendPartner,
  approveCommission,
  markCommissionPaid,
} from "@/app/actions/partners";
import { useState } from "react";

interface PartnerDetailViewProps {
  partner: Record<string, unknown>;
  attributions: Record<string, unknown>[];
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  suspended: { label: "Suspended", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const COMMISSION_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  paid: { label: "Paid", className: "bg-brand/10 text-brand border-brand/20" },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function PartnerDetailView({ partner, attributions }: PartnerDetailViewProps) {
  const [acting, setActing] = useState<string | null>(null);

  const status = String(partner.status ?? "pending");
  const statusConfig = STATUS_MAP[status] ?? STATUS_MAP.pending;
  const partnerId = String(partner.id);

  async function handleApprove() {
    setActing("approve");
    await approvePartner(partnerId);
    setActing(null);
  }

  async function handleSuspend() {
    setActing("suspend");
    await suspendPartner(partnerId);
    setActing(null);
  }

  async function handleApproveCommission(attrId: string) {
    setActing(attrId);
    await approveCommission(attrId, 0);
    setActing(null);
  }

  async function handleMarkPaid(attrId: string) {
    setActing(attrId);
    await markCommissionPaid(attrId);
    setActing(null);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-glass-border/10 bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-heading text-lg">Partner Information</CardTitle>
            <Badge className={cn("border", statusConfig.className)}>{statusConfig.label}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Building2} label="Name" value={String(partner.name ?? "—")} />
            <InfoRow icon={Mail} label="Contact" value={String(partner.contact_email ?? "—")} />
            <InfoRow icon={Globe} label="Type" value={String(partner.type ?? "—")} />
            <InfoRow icon={Copy} label="Code" value={String(partner.partner_code ?? "—")} mono />
          </CardContent>
        </Card>

        <Card className="border-glass-border/10 bg-card">
          <CardHeader>
            <CardTitle className="text-heading text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {status === "pending" && (
              <Button onClick={handleApprove} disabled={acting === "approve"} className="w-full">
                <CheckCircle2 size={14} className="mr-2" /> Approve Partner
              </Button>
            )}
            {status === "active" && (
              <Button onClick={handleSuspend} disabled={acting === "suspend"} variant="destructive" className="w-full">
                <Ban size={14} className="mr-2" /> Suspend Partner
              </Button>
            )}
            {status === "suspended" && (
              <Button onClick={handleApprove} disabled={acting === "approve"} className="w-full">
                <CheckCircle2 size={14} className="mr-2" /> Reactivate Partner
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-glass-border/10 bg-card">
        <CardHeader>
          <CardTitle className="text-heading text-lg">Attributions & Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {attributions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No attributions recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributions.map((attr) => {
                  const attrId = String(attr.id);
                  const commStatus = String(attr.commission_status ?? "pending");
                  const commConfig = COMMISSION_STATUS_MAP[commStatus] ?? COMMISSION_STATUS_MAP.pending;
                  return (
                    <TableRow key={attrId}>
                      <TableCell className="text-muted-foreground">
                        {new Date(String(attr.created_at)).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>{attr.quote_id ? "Quote" : "Event"}</TableCell>
                      <TableCell className="font-mono">
                        {attr.commission_amount != null ? formatCurrency(Number(attr.commission_amount)) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border", commConfig.className)}>{commConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {commStatus === "pending" && (
                            <Button size="sm" onClick={() => handleApproveCommission(attrId)} disabled={acting === attrId}>
                              Approve
                            </Button>
                          )}
                          {commStatus === "approved" && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkPaid(attrId)} disabled={acting === attrId}>
                              <DollarSign size={14} className="mr-1" /> Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground w-24">{label}</span>
      <span className={cn("text-sm text-foreground", mono && "font-mono text-brand")}>{value}</span>
    </div>
  );
}
