/** Partner home — what needs you, what you'll get paid, and your live book. */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Share2, ArrowRight, TrendingUp } from "lucide-react";

import { PortalPageShell, partnerTabs } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardKpi } from "@/components/ui/DashboardKpi";
import { EmptyState } from "@/components/ui/EmptyState";

import { PartnerActionQueue } from "@/components/partners/PartnerActionQueue";
import { NextPayoutCard } from "@/components/partners/NextPayoutCard";
import { PartnerDealList } from "@/components/partners/PartnerPipeline";
import { ReferralLinkCard } from "@/components/partners/ReferralLinkCard";

import { getUser } from "@/lib/auth";
import { isPartnerAdmin } from "@/lib/roles";
import { getPartnerForUser } from "@/lib/queries/partners";
import {
  getPartnerPipeline,
  getPartnerCommissionSummary,
} from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatMoneyFromPence } from "@/lib/currency";

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartnerDashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const [deals, summary, unread] = await Promise.all([
    getPartnerPipeline(partner.id),
    getPartnerCommissionSummary(partner.id),
    getUnreadCount(user.id),
  ]);

  const partnerName = String(partner.name ?? "Partner");
  // Payout figures are the org lead's business — member sellers see their
  // pipeline but not the commission money view.
  const showCommissions = isPartnerAdmin(user.role);
  const wonDeals = deals.filter((d) => d.kind === "event").length;
  const openQuotes = deals.filter(
    (d) => d.kind === "quote" && d.status === "pending",
  ).length;
  const clientsReferred = new Set(deals.map((d) => d.clientName)).size;

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={partnerName}
      section="Dashboard"
      slug={slug}
      tabs={partnerTabs(slug, user.role)}
      title={`Welcome back, ${partnerName}`}
      subtitle="Everything you need to chase, win, and get paid — in one view."
      heroRight={
        <>
          <Button asChild variant="glass" size="sm">
            <Link href={`/partners/${slug}/resources`}>
              <Sparkles className="h-4 w-4" /> Resources
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href={`/partners/${slug}/quotes`}>
              <Share2 className="h-4 w-4" /> New quote
            </Link>
          </Button>
        </>
      }
    >
      <div
        className={
          showCommissions
            ? "grid grid-cols-2 gap-3 lg:grid-cols-4"
            : "grid grid-cols-3 gap-3"
        }
      >
        {showCommissions && (
          <DashboardKpi
            label="Total earned"
            value={formatMoneyFromPence(summary.totalEarned)}
            hint="Across all referrals"
          />
        )}
        <DashboardKpi
          label="Clients referred"
          value={String(clientsReferred)}
          hint={`${wonDeals} won`}
        />
        <DashboardKpi
          label="Open quotes"
          value={String(openQuotes)}
          hint="Awaiting a decision"
        />
        {showCommissions ? (
          <DashboardKpi
            label="Paid to date"
            value={formatMoneyFromPence(summary.totalPaid)}
          />
        ) : (
          <DashboardKpi
            label="Won events"
            value={String(wonDeals)}
            hint="Referrals that converted"
          />
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PartnerActionQueue
            deals={deals}
            quotesHref={`/partners/${slug}/quotes`}
          />

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--color-bb-cobalt)]" />
                Your book of business
              </CardTitle>
              <Link
                href={`/partners/${slug}/clients`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
              >
                All clients <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <EmptyState
                  icon={Share2}
                  title="Your book of business"
                  description="Referred clients and their deals appear here once someone books through your link or you send a quote. You haven't had a referral convert yet."
                  action={{ label: "Send Quote", href: `/partners/${slug}/quotes` }}
                  size="sm"
                  tone="flat"
                />
              ) : (
                <PartnerDealList deals={deals.slice(0, 5)} showCommissions={showCommissions} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {showCommissions && (
            <NextPayoutCard
              approvedCents={summary.totalApproved}
              pendingCents={summary.totalPending}
              paidCents={summary.totalPaid}
            />
          )}
          <ReferralLinkCard
            partnerCode={String(partner.partner_code ?? "")}
            partnerName={partnerName}
          />
        </div>
      </div>
    </PortalPageShell>
  );
}
