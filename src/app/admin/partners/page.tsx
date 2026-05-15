/** Internal partner management — all partners with status, type, and actions */
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getPartners } from "@/lib/queries/partners";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminPartnerTable } from "./AdminPartnerTable";

export default async function AdminPartnersPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const partners = await getPartners();

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Partner Management"
        subtitle="Review, approve, and manage partner accounts"
      />
      <AdminPartnerTable partners={partners as Record<string, unknown>[]} />
    </AppShell>
  );
}
