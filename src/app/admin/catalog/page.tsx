/** Internal catalog management — CRUD entry point for machines, games, packages, case studies. */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Box, Gamepad2, Package, BookOpen, ArrowRight } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";

import { getUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";

const SECTIONS = [
  {
    title: "Machines",
    description: "Manage hardware units, specs, and imagery",
    icon: Box,
    href: "/admin/catalog/machines",
  },
  {
    title: "Games",
    description: "Manage game software, previews, and configurations",
    icon: Gamepad2,
    href: "/admin/catalog/games",
  },
  {
    title: "Packages",
    description: "Manage pricing tiers, add-ons, and feature lists",
    icon: Package,
    href: "/admin/catalog/packages",
  },
  {
    title: "Case studies",
    description: "Manage published portfolio pieces and testimonials",
    icon: BookOpen,
    href: "/admin/catalog/case-studies",
  },
] as const;

export const metadata = {
  title: "Catalog",
};

export default async function CatalogAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCreativeProduct(user.role)) redirect("/");

  const unread = await getUnreadCount(user.id);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Catalog"
      title="The storefront."
      subtitle="Manage the public catalog — machines, games, packages, and case studies that cold visitors land on."
    >
      <section className="py-8">
        <EditorialEyebrow>Manage</EditorialEyebrow>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className="group flex items-center gap-4 border border-border/60 bg-card/30 rounded-md p-5 hover:bg-accent/30 hover:border-border transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/60 bg-card/60 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {section.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      </section>
    </AdminPageShell>
  );
}
