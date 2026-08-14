/** Admin CRUD page for managing games in the catalog. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { GamesTable } from "@/components/catalog/GamesTable";

import { getUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { getAllGames } from "@/lib/queries/admin-catalog";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "Game library",
};

export default async function GamesAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCreativeProduct(user.role)) redirect("/");

  const [games, unread] = await Promise.all([
    getAllGames(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Games"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Catalog", href: "/admin/catalog" },
        { label: "Games" },
      ]}
      title="Game library."
      subtitle="Software titles available for machines — manage games and their metadata."
      backHref="/admin/catalog"
      backLabel="Back to catalogue"
    >
      <section className="py-8">
        <EditorialEyebrow accent>All games</EditorialEyebrow>
        <div className="mt-4">
          <GamesTable games={games} />
        </div>
      </section>
    </AdminPageShell>
  );
}
