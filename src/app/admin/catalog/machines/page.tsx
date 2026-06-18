/** Admin CRUD page for managing machines in the catalog. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { MachinesTable } from "@/components/catalog/MachinesTable";

import { getUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { getAllMachines } from "@/lib/queries/admin-catalog";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function MachinesAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCreativeProduct(user.role)) redirect("/");

  const [machines, unread] = await Promise.all([
    getAllMachines(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Machines"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Catalog", href: "/admin/catalog" },
        { label: "Machines" },
      ]}
      title="Machine fleet."
      subtitle="Hardware units available for booking — add, edit, or deactivate machines."
      backHref="/admin/catalog"
      backLabel="Back to catalog"
    >
      <section className="py-8">
        <EditorialEyebrow accent>All machines</EditorialEyebrow>
        <div className="mt-4">
          <MachinesTable machines={machines} />
        </div>
      </section>
    </AdminPageShell>
  );
}
