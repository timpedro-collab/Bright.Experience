/** Internal partner management — all partners with status, type, and actions. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { AdminPartnerTable } from "./AdminPartnerTable";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getPartners } from "@/lib/queries/partners";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function AdminPartnersPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const [partners, unread] = await Promise.all([
    getPartners(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Partners"
      title="Partner management."
      subtitle="Review, approve, and manage partner accounts."
      heroRight={
        partners.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {partners.length}
            </span>{" "}
            partners
          </div>
        ) : null
      }
    >
      <div className="py-8">
        <AdminPartnerTable partners={partners as Record<string, unknown>[]} />
      </div>
    </AdminPageShell>
  );
}
