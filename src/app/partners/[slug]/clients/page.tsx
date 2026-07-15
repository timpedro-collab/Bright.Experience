/** Partner clients — every referred company, grouped, with what you've earned. */
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { getUser } from "@/lib/auth";
import { isPartnerAdmin } from "@/lib/roles";
import { getPartnerForUser } from "@/lib/queries/partners";
import {
  getPartnerPipeline,
  type PartnerDeal,
} from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PortalPageShell, partnerTabs } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartnerDealList } from "@/components/partners/PartnerPipeline";
import { formatMoneyFromPence } from "@/lib/currency";

interface ClientsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartnerClientsPage({ params }: ClientsPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const [deals, unread] = await Promise.all([
    getPartnerPipeline(partner.id),
    getUnreadCount(user.id),
  ]);
  const partnerName = String(partner.name ?? "Partner");
  // Per-client commission totals are the org lead's view.
  const showCommissions = isPartnerAdmin(user.role);

  // Group every deal under its client so the partner sees relationships, not rows.
  const byClient = new Map<string, PartnerDeal[]>();
  for (const deal of deals) {
    const list = byClient.get(deal.clientName) ?? [];
    list.push(deal);
    byClient.set(deal.clientName, list);
  }
  const clients = [...byClient.entries()].map(([name, clientDeals]) => ({
    name,
    deals: clientDeals,
    earned: clientDeals.reduce((sum, d) => sum + (d.commissionCents ?? 0), 0),
  }));

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Clients"
      slug={slug}
      tabs={partnerTabs(slug, user.role)}
      title="Your clients"
      subtitle={
        showCommissions
          ? "Every company you've referred, and what each has earned you."
          : "Every company you've referred, grouped by relationship."
      }
    >
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Companies who book through your partner link will appear here, grouped by relationship."
          size="sm"
        />
      ) : (
        <div className="space-y-5">
          {clients.map((client) => (
            <Card key={client.name}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {client.name}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {client.deals.length} deal{client.deals.length === 1 ? "" : "s"}
                  </span>
                </CardTitle>
                {showCommissions && (
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatMoneyFromPence(client.earned)}
                    </p>
                    <p className="text-[0.65rem] text-muted-foreground">earned</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <PartnerDealList deals={client.deals} showCommissions={showCommissions} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PortalPageShell>
  );
}
