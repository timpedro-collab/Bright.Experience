/** Partner detail view with info cards, attributions, and commission actions */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDateMedium } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Ban,
  DollarSign,
  Building2,
  Mail,
  Globe,
  Copy,
  UserPlus,
} from "lucide-react";
import {
  approvePartner,
  suspendPartner,
  approveCommission,
  markCommissionPaid,
} from "@/app/actions/partners";
import { InvitePartnerUserForm } from "@/components/partners/InvitePartnerUserForm";
import { formatMoneyFromPence } from "@/lib/currency";
import { useState } from "react";

interface PartnerDetailViewProps {
  partner: Record<string, unknown>;
  attributions: Record<string, unknown>[];
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success/15 text-success border-success/30" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  suspended: { label: "Suspended", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

const COMMISSION_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  approved: { label: "Approved", className: "bg-success/15 text-success border-success/30" },
  paid: { label: "Paid", className: "bg-primary/15 text-primary border-primary/30" },
};

/** Commission amounts are integer cents. */
function formatCurrency(cents: number): string {
  return formatMoneyFromPence(cents);
}

export function PartnerDetailView({ partner, attributions }: PartnerDetailViewProps) {
  const [acting, setActing] = useState<string | null>(null);
  const [commissionAmounts, setCommissionAmounts] = useState<Record<string, string>>({});

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
    const raw = commissionAmounts[attrId];
    const amount = raw ? Number(raw) : 0;
    if (!raw || Number.isNaN(amount) || amount <= 0) return;
    setActing(attrId);
    await approveCommission(attrId, amount);
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
        <Card className="border-border bg-card lg:col-span-2">
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

        <div className="space-y-6">
          <Card className="border-border bg-card">
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

          <InviteTeamMemberCard partnerId={partnerId} />
        </div>
      </div>

      <Card className="border-border bg-card">
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
                  <TableHead className="text-right">Commission</TableHead>
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
                        {formatDateMedium(String(attr.created_at))}
                      </TableCell>
                      <TableCell>{attr.quote_id ? "Quote" : "Event"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {attr.commission_amount != null ? formatCurrency(Number(attr.commission_amount)) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border", commConfig.className)}>{commConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {commStatus === "pending" && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="$ amount"
                                className="w-28 h-8 text-sm"
                                value={commissionAmounts[attrId] ?? ""}
                                onChange={(e) =>
                                  setCommissionAmounts((prev) => ({ ...prev, [attrId]: e.target.value }))
                                }
                              />
                              <Button
                                size="sm"
                                onClick={() => handleApproveCommission(attrId)}
                                disabled={acting === attrId || !commissionAmounts[attrId]}
                              >
                                Approve
                              </Button>
                            </div>
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

/** Email-invite a team member into this partner organisation's portal. */
function InviteTeamMemberCard({ partnerId }: { partnerId: string }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-heading text-lg flex items-center gap-2">
          <UserPlus size={16} /> Invite Team Member
        </CardTitle>
      </CardHeader>
      <CardContent>
        <InvitePartnerUserForm partnerId={partnerId} />
      </CardContent>
    </Card>
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
