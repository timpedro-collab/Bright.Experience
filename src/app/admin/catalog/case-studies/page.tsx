/** Admin CRUD page for managing case studies in the catalog. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { CaseStudiesTable } from "@/components/catalog/CaseStudiesTable";

import { getUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { getAllCaseStudies } from "@/lib/queries/admin-catalog";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "Case studies",
};

export default async function CaseStudiesAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCreativeProduct(user.role)) redirect("/");

  const [studies, unread] = await Promise.all([
    getAllCaseStudies(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Case studies"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Catalog", href: "/admin/catalog" },
        { label: "Case studies" },
      ]}
      title="Portfolio pieces."
      subtitle="Published case studies and testimonials that power the public site."
      backHref="/admin/catalog"
      backLabel="Back to catalogue"
    >
      <section className="py-8">
        <EditorialEyebrow accent>All case studies</EditorialEyebrow>
        <div className="mt-4">
          <CaseStudiesTable studies={studies} />
        </div>
      </section>
    </AdminPageShell>
  );
}
