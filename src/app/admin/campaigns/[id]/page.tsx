/** Internal campaign detail page with dashboard and event management. */
import { notFound, redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { CampaignDashboard } from "@/components/campaigns/CampaignDashboard";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getCampaignById } from "@/lib/queries/campaigns";
import { getLatestMetricsForEvents } from "@/lib/queries/event-metrics";
import { getUnreadCount } from "@/lib/queries/notifications";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  active: { label: "Active", className: "bg-brand/20 text-brand" },
  completed: { label: "Completed", className: "bg-success/20 text-success" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export const metadata = {
  title: "Campaign detail",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const { id } = await params;
  const [campaign, unread] = await Promise.all([
    getCampaignById(id),
    getUnreadCount(user.id),
  ]);
  if (!campaign) return notFound();

  const status = String(campaign.status ?? "draft");
  const statusConfig = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const events =
    (campaign.campaign_events ?? []) as Array<Record<string, unknown>>;

  const eventIds = events
    .map((ce) => {
      const evt = (ce.events ?? ce) as Record<string, unknown>;
      return evt.id ? String(evt.id) : null;
    })
    .filter((id): id is string => id !== null);
  const metricsByEvent = await getLatestMetricsForEvents(eventIds);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section={campaign.name}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Campaigns", href: "/admin/campaigns" },
        { label: campaign.name },
      ]}
      eyebrow="Internal · Campaign"
      title={`${campaign.name}.`}
      heroRight={
        <Badge className={`border-0 text-xs ${statusConfig.className}`}>
          {statusConfig.label}
        </Badge>
      }
      backHref="/admin/campaigns"
      backLabel="Back to campaigns"
    >
      <div className="py-8">
        <CampaignDashboard
          campaign={campaign as Record<string, unknown>}
          events={events}
          metricsByEvent={metricsByEvent}
        />
      </div>
    </AdminPageShell>
  );
}
