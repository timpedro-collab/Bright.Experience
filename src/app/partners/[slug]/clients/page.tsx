/** Partner attributed clients list — accounts and events referred by this partner */
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
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

interface ClientsPageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning"> = {
  paid: "default",
  approved: "success",
  pending: "warning",
};

export default async function PartnerClientsPage({ params }: ClientsPageProps) {
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

  const clientAttributions = attributions.filter(
    (a: Record<string, unknown>) => a.event_id || a.quote_id
  );

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Clients"
      slug={slug}
      tabs={partnerTabs(slug)}
      title="Clients"
      subtitle="Accounts and events attributed to your referrals"
    >
      {clientAttributions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No attributed clients yet"
          description="Clients who sign up through your partner link will appear here."
          size="sm"
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Reference</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientAttributions.map((attr: Record<string, unknown>) => {
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
                    <TableCell className="text-foreground">
                      {attr.quote_id ? "Quote" : "Event"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {String(attr.quote_id ?? attr.event_id ?? "—").slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[status] ?? "warning"}>
                        {status}
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
