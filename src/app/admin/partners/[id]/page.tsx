/** Internal partner detail — partner info, attributions, and commission management */
import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getPartners } from "@/lib/queries/partners";
import { getAttributionsByPartner } from "@/lib/queries/partner-attributions";
import { PartnerDetailView } from "./PartnerDetailView";

interface PartnerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminPartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const partners = await getPartners();
  const partner = partners.find((p: Record<string, unknown>) => String(p.id) === id);
  if (!partner) notFound();

  const attributions = await getAttributionsByPartner(id);

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title={`Partner — ${String(partner.name ?? "Detail")}`}
        subtitle="Manage partner account and commissions"
        breadcrumbs={[
          { label: "Partners", href: "/admin/partners" },
          { label: String(partner.name ?? "Detail") },
        ]}
      />
      <PartnerDetailView
        partner={partner as Record<string, unknown>}
        attributions={attributions as Record<string, unknown>[]}
      />
    </AppShell>
  );
}
