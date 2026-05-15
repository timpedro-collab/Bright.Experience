/** Partner commission tracking — earnings breakdown and attribution history */
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getAttributionsByPartner, getPartnerCommissionSummary } from "@/lib/queries/partner-attributions";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { CommissionTracker } from "@/components/partners/CommissionTracker";
import { PartnerPipelineTable } from "@/components/partners/PartnerPipelineTable";

interface CommissionsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PartnerCommissionsPage({ params }: CommissionsPageProps) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const partner = await getPartnerForUser(user.id);
  if (!partner || partner.slug !== slug) redirect("/");

  const [attributions, summary] = await Promise.all([
    getAttributionsByPartner(partner.id),
    getPartnerCommissionSummary(partner.id),
  ]);

  const partnerName = String(partner.name ?? "Partner");

  return (
    <AppShell user={user}>
      <PageHeader
        title="Commissions"
        subtitle="Track your earnings and payout status"
        breadcrumbs={[
          { label: "Partners", href: `/partners/${slug}/dashboard` },
          { label: partnerName, href: `/partners/${slug}/dashboard` },
          { label: "Commissions" },
        ]}
      />
      <div className="space-y-8">
        <CommissionTracker
          totalEarned={summary.totalEarned}
          pending={summary.totalPending}
          paid={summary.totalPaid}
        />
        <div>
          <h2 className="text-heading mb-4 text-lg font-semibold text-text-primary">
            Attribution History
          </h2>
          <PartnerPipelineTable attributions={attributions.map((a: Record<string, unknown>) => ({
            id: String(a.id),
            quoteId: a.quote_id ? String(a.quote_id) : undefined,
            eventId: a.event_id ? String(a.event_id) : undefined,
            commissionAmount: a.commission_amount != null ? Number(a.commission_amount) : undefined,
            commissionStatus: String(a.commission_status ?? "pending"),
            createdAt: String(a.created_at),
          }))} />
        </div>
      </div>
    </AppShell>
  );
}
