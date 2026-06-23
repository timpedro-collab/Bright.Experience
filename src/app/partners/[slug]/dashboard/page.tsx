/** Partner home — what needs you, what you'll get paid, and your live book. */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Share2, ArrowRight, TrendingUp } from "lucide-react";

import { PortalPageShell, partnerTabs } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";

import { PartnerActionQueue } from "@/components/partners/PartnerActionQueue";
import { NextPayoutCard } from "@/components/partners/NextPayoutCard";
import { PartnerDealList } from "@/components/partners/PartnerPipeline";
import { ReferralLinkCard } from "@/components/partners/ReferralLinkCard";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import {
  getPartnerPipeline,
  getPartnerCommissionSummary,
} from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatUSDFromCents } from "@/lib/currency";

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
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
      tabs={partnerTabs(slug)}
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Total earned"
          value={formatUSDFromCents(summary.totalEarned)}
          hint="Across all referrals"
        />
        <Kpi
          label="Clients referred"
          value={String(clientsReferred)}
          hint={`${wonDeals} won`}
        />
        <Kpi
          label="Open quotes"
          value={String(openQuotes)}
          hint="Awaiting a decision"
        />
        <Kpi
          label="Paid to date"
          value={formatUSDFromCents(summary.totalPaid)}
        />
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
                  title="No referrals yet"
                  description="Share your link below — the moment a client books through it, they'll show up here with full commission tracking."
                  size="sm"
                />
              ) : (
                <PartnerDealList deals={deals.slice(0, 5)} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <NextPayoutCard
            approvedCents={summary.totalApproved}
            pendingCents={summary.totalPending}
            paidCents={summary.totalPaid}
          />
          <ReferralLinkCard
            partnerCode={String(partner.partner_code ?? "")}
            partnerName={partnerName}
          />
        </div>
      </div>
    </PortalPageShell>
  );
}
