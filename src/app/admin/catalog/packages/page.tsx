/** Admin CRUD page for managing packages in the catalog. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { PackagesTable } from "@/components/catalog/PackagesTable";

import { getUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { getAllPackages, getAllMachines } from "@/lib/queries/admin-catalog";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function PackagesAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCreativeProduct(user.role)) redirect("/");

  const [packages, machines, unread] = await Promise.all([
    getAllPackages(),
    getAllMachines(),
    getUnreadCount(user.id),
  ]);

  const machineOptions = machines.map((m) => ({ id: m.id, name: m.name }));

  const normalised = packages.map((p) => {
    const m = Array.isArray(p.machines) ? p.machines[0] : p.machines;
    return {
      id: p.id as string,
      name: p.name as string,
      slug: p.slug as string,
      tier: p.tier as string,
      base_price: p.base_price as number | null,
      is_bookable: p.is_bookable as boolean,
      machineName: (m?.name as string) ?? null,
    };
  });

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Packages"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Catalog", href: "/admin/catalog" },
        { label: "Packages" },
      ]}
      title="Pricing packages."
      subtitle="Tiers, add-ons, and feature lists — the building blocks of every quote."
      backHref="/admin/catalog"
      backLabel="Back to catalog"
    >
      <section className="py-8">
        <EditorialEyebrow accent>All packages</EditorialEyebrow>
        <div className="mt-4">
          <PackagesTable
            packages={normalised}
            allMachines={machineOptions}
          />
        </div>
      </section>
    </AdminPageShell>
  );
}
