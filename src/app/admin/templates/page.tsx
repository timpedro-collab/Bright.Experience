/** Internal page for managing event templates */
import { redirect } from "next/navigation";
import { FileStack, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTemplates } from "@/lib/queries/templates";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function TemplatesPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const templates = await getTemplates();

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Event Templates"
        subtitle="Reusable templates for bootstrapping new events"
        actions={
          <Button>
            <Plus size={16} /> New Template
          </Button>
        }
      />
      {templates.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileStack}
            title="No templates yet"
            description="Create event templates to auto-populate milestones, tasks, assets, and QA checklists when new events are created."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="card p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">{template.name}</h3>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {template.event_type}
                </Badge>
              </div>
              {template.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{template.milestones_json?.length ?? 0} milestones</span>
                <span>{template.tasks_json?.length ?? 0} tasks</span>
                <span>{template.assets_json?.length ?? 0} assets</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
