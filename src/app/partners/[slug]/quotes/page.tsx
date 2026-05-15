/** Partner quote pipeline — all partner-attributed quotes with status */
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getAttributionsByPartner } from "@/lib/queries/partner-attributions";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { FileText } from "lucide-react";

interface QuotesPageProps {
  params: Promise<{ slug: string }>;
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

export default async function PartnerQuotesPage({ params }: QuotesPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const attributions = await getAttributionsByPartner(partner.id);
  const partnerName = String(partner.name ?? "Partner");

  const quoteAttributions = attributions.filter(
    (a: Record<string, unknown>) => a.quoteId
  );

  return (
    <AppShell user={user}>
      <PageHeader
        title="Quote Pipeline"
        subtitle="All quotes attributed to your referrals"
        breadcrumbs={[
          { label: "Partners", href: `/partners/${slug}/dashboard` },
          { label: partnerName, href: `/partners/${slug}/dashboard` },
          { label: "Quotes" },
        ]}
      />

      {quoteAttributions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] p-16 text-center">
          <FileText size={32} className="mb-3 text-text-muted" />
          <p className="text-sm text-text-muted">No quotes in your pipeline</p>
          <p className="mt-1 text-xs text-text-muted">
            Quotes generated through your partner link will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-text-muted">Date</TableHead>
                <TableHead className="text-text-muted">Quote ID</TableHead>
                <TableHead className="text-text-muted">Commission</TableHead>
                <TableHead className="text-text-muted">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteAttributions.map((attr: Record<string, unknown>) => {
                const status = String(attr.commissionStatus ?? "pending");
                const statusConfig = STATUS_MAP[status] ?? STATUS_MAP.pending;
                return (
                  <TableRow key={String(attr.id)} className="border-white/[0.06]">
                    <TableCell className="text-text-secondary">
                      {new Date(String(attr.createdAt)).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-primary">
                      {String(attr.quoteId ?? "—").slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-mono text-text-primary">
                      {attr.commissionAmount != null
                        ? formatCurrency(Number(attr.commissionAmount))
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
      )}
    </AppShell>
  );
}
