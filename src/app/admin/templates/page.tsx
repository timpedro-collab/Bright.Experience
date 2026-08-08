/** Internal page for managing event templates. */
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileStack, Plus } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getTemplates } from "@/lib/queries/templates";
import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";

export const metadata = {
  title: "Templates",
};

export default async function TemplatesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [templates, unread] = await Promise.all([
    getTemplates(),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Templates"
      title="Event templates."
      subtitle="Reusable templates for bootstrapping new events — milestones, tasks, assets, QA checklists in one drop."
      heroRight={
        <Button asChild size="sm">
          <Link href="/admin/templates/new">
            <Plus size={14} className="mr-1.5" /> Create template
          </Link>
        </Button>
      }
    >
      <div className="py-8">
        {templates.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title="No templates yet"
            description="Create event templates to auto-populate milestones, tasks, assets, and QA checklists when new events are created."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/admin/templates/${template.id}/edit`}
                className="border border-border/60 bg-card/40 rounded-md p-5 space-y-3 block hover:border-[var(--color-bb-cobalt)]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {template.name}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {template.event_type}
                  </Badge>
                </div>
                {template.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-overline text-muted-foreground">
                  <span>{template.milestones_json?.length ?? 0} milestones</span>
                  <span>·</span>
                  <span>{template.tasks_json?.length ?? 0} tasks</span>
                  <span>·</span>
                  <span>{template.assets_json?.length ?? 0} assets</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
