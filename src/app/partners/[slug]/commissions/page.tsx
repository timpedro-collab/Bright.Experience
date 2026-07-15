/** Partner commissions — what's coming, what's pending, and the full history. */
import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { isPartnerAdmin } from "@/lib/roles";
import { getPartnerForUser } from "@/lib/queries/partners";
import {
  getPartnerPipeline,
  getPartnerCommissionSummary,
} from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PortalPageShell, partnerTabs } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NextPayoutCard } from "@/components/partners/NextPayoutCard";
import { PartnerDealList } from "@/components/partners/PartnerPipeline";

interface CommissionsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartnerCommissionsPage({ params }: CommissionsPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");
  // Commission management belongs to the partner org lead, not member sellers.
  if (!isPartnerAdmin(user.role)) redirect(`/partners/${slug}/dashboard`);

  const [deals, summary, unread] = await Promise.all([
    getPartnerPipeline(partner.id),
    getPartnerCommissionSummary(partner.id),
    getUnreadCount(user.id),
  ]);

  const partnerName = String(partner.name ?? "Partner");
  const withCommission = deals.filter((d) => d.commissionCents != null);

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Commissions"
      slug={slug}
      tabs={partnerTabs(slug, user.role)}
      title="Commissions"
      subtitle="What's landing next, what's still in the pipeline, and your full history."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div>
          <NextPayoutCard
            approvedCents={summary.totalApproved}
            pendingCents={summary.totalPending}
            paidCents={summary.totalPaid}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Commission history</CardTitle>
          </CardHeader>
          <CardContent>
            {withCommission.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                No commissions yet — they&apos;ll appear here as your referrals
                convert and get approved.
              </p>
            ) : (
              <PartnerDealList deals={withCommission} />
            )}
          </CardContent>
        </Card>
      </div>
    </PortalPageShell>
  );
}
