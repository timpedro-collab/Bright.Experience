/** Internal partner detail — partner info, attributions, and commission management. */
import { redirect, notFound } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { PartnerDetailView } from "./PartnerDetailView";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getPartners } from "@/lib/queries/partners";
import { getAttributionsByPartner } from "@/lib/queries/partner-attributions";
import { getUnreadCount } from "@/lib/queries/notifications";

interface PartnerDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Partner detail",
};

export default async function AdminPartnerDetailPage({
  params,
}: PartnerDetailPageProps) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [partners, attributions, unread] = await Promise.all([
    getPartners(),
    getAttributionsByPartner(id),
    getUnreadCount(user.id),
  ]);
  const partner = partners.find(
    (p: Record<string, unknown>) => String(p.id) === id,
  );
  if (!partner) notFound();

  const partnerName = String(partner.name ?? "Partner");

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section={partnerName}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Partners", href: "/admin/partners" },
        { label: partnerName },
      ]}
      title={`${partnerName}.`}
      subtitle="Manage partner account, attributions, and commission terms."
      backHref="/admin/partners"
      backLabel="Back to partners"
    >
      <div className="py-8">
        <PartnerDetailView
          partner={partner as Record<string, unknown>}
          attributions={attributions as Record<string, unknown>[]}
        />
      </div>
    </AdminPageShell>
  );
}
