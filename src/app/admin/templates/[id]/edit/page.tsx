/** Admin visual template editor. */
import { redirect, notFound } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getTemplateById } from "@/lib/queries/templates";
import { TemplateEditor } from "@/components/admin/TemplateEditor";

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [template, unread] = await Promise.all([
    getTemplateById(id),
    getUnreadCount(user.id),
  ]);

  if (!template) notFound();

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Templates"
      title={`Edit: ${template.name}`}
      subtitle="Visually edit the template's milestones, tasks, assets, QA items, compliance docs, venue requirements, and configuration defaults."
    >
      <div className="py-8">
        <TemplateEditor template={template} />
      </div>
    </AdminPageShell>
  );
}
