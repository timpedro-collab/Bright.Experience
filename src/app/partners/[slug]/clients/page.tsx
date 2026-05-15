/** Partner attributed clients list — accounts and events referred by this partner */
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
import { Users } from "lucide-react";

interface ClientsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartnerClientsPage({ params }: ClientsPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const attributions = await getAttributionsByPartner(partner.id);
  const partnerName = String(partner.name ?? "Partner");

  const clientAttributions = attributions.filter(
    (a: Record<string, unknown>) => a.eventId || a.quoteId
  );

  return (
    <AppShell user={user}>
      <PageHeader
        title="Clients"
        subtitle="Accounts and events attributed to your referrals"
        breadcrumbs={[
          { label: "Partners", href: `/partners/${slug}/dashboard` },
          { label: partnerName, href: `/partners/${slug}/dashboard` },
          { label: "Clients" },
        ]}
      />

      {clientAttributions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] p-16 text-center">
          <Users size={32} className="mb-3 text-text-muted" />
          <p className="text-sm text-text-muted">No attributed clients yet</p>
          <p className="mt-1 text-xs text-text-muted">
            Clients who sign up through your partner link will appear here
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-text-muted">Date</TableHead>
                <TableHead className="text-text-muted">Type</TableHead>
                <TableHead className="text-text-muted">Reference</TableHead>
                <TableHead className="text-text-muted">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientAttributions.map((attr: Record<string, unknown>) => (
                <TableRow key={String(attr.id)} className="border-white/[0.06]">
                  <TableCell className="text-text-secondary">
                    {new Date(String(attr.createdAt)).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {attr.quoteId ? "Quote" : "Event"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-muted">
                    {String(attr.quoteId ?? attr.eventId ?? "—").slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "border",
                        attr.commissionStatus === "paid"
                          ? "bg-brand/10 text-brand border-brand/20"
                          : attr.commissionStatus === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}
                    >
                      {String(attr.commissionStatus ?? "pending")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
