/** Internal campaign detail page with dashboard and event management. */
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { CampaignDashboard } from "@/components/campaigns/CampaignDashboard";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getCampaignById } from "@/lib/queries/campaigns";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  active: { label: "Active", className: "bg-brand/20 text-brand" },
  completed: { label: "Completed", className: "bg-success/20 text-success" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) return notFound();

  const status = String(campaign.status ?? "draft");
  const statusConfig = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const events = (campaign.campaign_events ?? []) as Array<Record<string, unknown>>;

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title={campaign.name}
        breadcrumbs={[
          { label: "Campaigns", href: "/admin/campaigns" },
          { label: campaign.name },
        ]}
        actions={
          <Badge className={`border-0 text-xs ${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
        }
      />

      <CampaignDashboard
        campaign={campaign as Record<string, unknown>}
        events={events}
      />
    </AppShell>
  );
}
