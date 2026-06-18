/** Partner quote pipeline — all partner-attributed quotes with status */
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getAttributionsByPartner } from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PortalPageShell, partnerTabs } from "@/components/brand";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface QuotesPageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  approved: "success",
  paid: "default",
  rejected: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
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

  const [attributions, unread] = await Promise.all([
    getAttributionsByPartner(partner.id),
    getUnreadCount(user.id),
  ]);
  const partnerName = String(partner.name ?? "Partner");

  const quoteAttributions = attributions.filter(
    (a: Record<string, unknown>) => a.quote_id
  );

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Quotes"
      slug={slug}
      tabs={partnerTabs(slug)}
      title="Quote pipeline"
      subtitle="All quotes attributed to your referrals"
    >
      {quoteAttributions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes in your pipeline"
          description="Quotes generated through your partner link will appear here."
          size="sm"
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Quote ID</TableHead>
                <TableHead className="text-muted-foreground">Commission</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteAttributions.map((attr: Record<string, unknown>) => {
                const status = String(attr.commission_status ?? "pending");
                return (
                  <TableRow key={String(attr.id)} className="border-border/60">
                    <TableCell className="text-muted-foreground">
                      {new Date(String(attr.created_at)).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {String(attr.quote_id ?? "—").slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {attr.commission_amount != null
                        ? formatCurrency(Number(attr.commission_amount))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[status] ?? "warning"}>
                        {STATUS_LABEL[status] ?? status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PortalPageShell>
  );
}
