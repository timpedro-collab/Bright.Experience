/** Admin visual template editor. */
import { redirect, notFound } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { TemplateEditor } from "@/components/admin/TemplateEditor";

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const supabase = getServiceRoleClient();
  const { data: template } = await supabase
    .from("event_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!template) notFound();

  const unread = await getUnreadCount(user.id);

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
