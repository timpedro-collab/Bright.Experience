/** Internal catalog management — CRUD for machines, games, packages, case studies */
import { redirect } from "next/navigation";
import { Box, Gamepad2, Package, BookOpen } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

const SECTIONS = [
  {
    title: "Machines",
    description: "Manage hardware units, specs, and imagery",
    icon: Box,
    href: "/admin/catalog/machines",
    color: "text-brand",
  },
  {
    title: "Games",
    description: "Manage game software, previews, and configurations",
    icon: Gamepad2,
    href: "/admin/catalog/games",
    color: "text-brand-soft",
  },
  {
    title: "Packages",
    description: "Manage pricing tiers, add-ons, and feature lists",
    icon: Package,
    href: "/admin/catalog/packages",
    color: "text-success",
  },
  {
    title: "Case Studies",
    description: "Manage published portfolio pieces and testimonials",
    icon: BookOpen,
    href: "/admin/catalog/case-studies",
    color: "text-warning",
  },
] as const;

export default async function CatalogAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Catalog Management"
        subtitle="Manage the public storefront content"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="card-interactive">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
                  <Icon size={20} className={section.color} />
                </div>
                <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={section.href}>Manage</a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
