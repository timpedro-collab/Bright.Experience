/** Internal partner management — all partners with status, type, and actions. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { AdminPartnerTable } from "./AdminPartnerTable";
import { Pagination } from "@/components/ui/Pagination";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getPartnersPaginated } from "@/lib/queries/partners";
import { getUnreadCount } from "@/lib/queries/notifications";
import { parsePage } from "@/lib/pagination";

interface AdminPartnersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminPartnersPage({ searchParams }: AdminPartnersPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const params = await searchParams;
  const page = parsePage(params);

  const [result, unread] = await Promise.all([
    getPartnersPaginated(page),
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
        result.totalCount > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-foreground text-base font-semibold">
              {result.totalCount}
            </span>{" "}
            partners
          </div>
        ) : null
      }
    >
      <div className="py-8">
        <AdminPartnerTable partners={result.data as Record<string, unknown>[]} />
        <Pagination
          currentPage={page}
          totalPages={result.totalPages}
          basePath="/admin/partners"
        />
      </div>
    </AdminPageShell>
  );
}
