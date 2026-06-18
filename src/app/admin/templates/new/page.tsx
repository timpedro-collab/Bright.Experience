/** Create a new event template. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { CreateTemplateForm } from "@/components/templates/CreateTemplateForm";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function NewTemplatePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const unread = await getUnreadCount(user.id);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Templates"
      title="Create template."
      subtitle="Define a reusable blueprint — milestones, tasks, assets, and QA items will be auto-populated when an event uses this template."
    >
      <div className="py-8 max-w-2xl">
        <CreateTemplateForm />
      </div>
    </AdminPageShell>
  );
}
