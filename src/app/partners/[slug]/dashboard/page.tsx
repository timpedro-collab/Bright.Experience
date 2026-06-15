/** Partner home dashboard — referral link, pipeline KPIs, recent attributions */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Share2 } from "lucide-react";

import { PortalPageShell, partnerTabs } from "@/components/brand";
import { NextStepCard } from "@/components/layout/NextStepCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";

import { PartnerDashboard } from "@/components/partners/PartnerDashboard";
import { PartnerPipelineTable } from "@/components/partners/PartnerPipelineTable";
import { ReferralLinkCard } from "@/components/partners/ReferralLinkCard";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import {
  getAttributionsByPartner,
  getPartnerCommissionSummary,
} from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartnerDashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const [attributions, summary, unread] = await Promise.all([
    getAttributionsByPartner(partner.id),
    getPartnerCommissionSummary(partner.id),
    getUnreadCount(user.id),
  ]);

  const partnerName = String(partner.name ?? "Partner");
  const activeQuotes = attributions.filter(
    (a) => a.commission_status === "pending" && a.quote_id && !a.event_id
  ).length;
  const activeEvents = attributions.filter(
    (a) => a.event_id && a.commission_status !== "paid"
  ).length;

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Dashboard"
      slug={slug}
      tabs={partnerTabs(slug)}
      title="Partner dashboard"
      subtitle="Track every referral, conversion and commission from one workspace."
      heroRight={
        <>
          <Button asChild variant="glass" size="sm">
            <Link href={`/partners/${slug}/resources`}>
              <Sparkles className="h-4 w-4" /> Resources
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href={`/partners/${slug}/clients`}>
              <Share2 className="h-4 w-4" /> Clients
            </Link>
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <NextStepCard
          eyebrow="Grow your pipeline"
          title="Share your referral link to start earning"
          description="Every client who books via your code is attributed to you automatically — and you get a clear view of every commission below."
          primaryAction={{ label: "Open resources", href: `/partners/${slug}/resources` }}
          secondaryAction={{ label: "Catalog walk-through", href: "/catalog" }}
        />
      </div>

      <div className="mb-6">
        <ReferralLinkCard
          partnerCode={String(partner.partner_code ?? "")}
          partnerName={partnerName}
        />
      </div>

      <div className="mb-6">
        <PartnerDashboard
          partner={partner as unknown as Record<string, unknown>}
          summary={{
            totalEarned: summary.totalEarned,
            pending: summary.totalPending,
            paid: summary.totalPaid,
            activeQuotes,
            activeEvents,
          }}
          partnerSlug={slug}
        />
      </div>

      <Card tone="subtle">
        <CardHeader className="pb-3">
          <CardTitle>Recent attributions</CardTitle>
        </CardHeader>
        <CardContent>
          {attributions.length === 0 ? (
            <EmptyState
              icon={Share2}
              title="No attributions yet"
              description="As soon as someone books through your referral link, they'll appear here with full commission tracking."
              action={{ label: "Get sharing assets", href: `/partners/${slug}/resources` }}
              size="sm"
            />
          ) : (
            <PartnerPipelineTable
              attributions={attributions.map((a: Record<string, unknown>) => ({
                id: String(a.id),
                quoteId: a.quote_id ? String(a.quote_id) : undefined,
                eventId: a.event_id ? String(a.event_id) : undefined,
                commissionAmount:
                  a.commission_amount != null ? Number(a.commission_amount) : undefined,
                commissionStatus: String(a.commission_status ?? "pending"),
                createdAt: String(a.created_at),
              }))}
            />
          )}
        </CardContent>
      </Card>
    </PortalPageShell>
  );
}
