/** Internal campaign management — grid of all campaigns with create option. */
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getCampaigns } from "@/lib/queries/campaigns";

export default async function CampaignsAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const campaigns = await getCampaigns();

  const campaignCards = await Promise.all(
    campaigns.map(async (c) => {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { count } = await supabase
        .from("campaign_events")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", c.id);

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        eventCount: count ?? 0,
        startDate: c.start_date ?? undefined,
        endDate: c.end_date ?? undefined,
      };
    })
  );

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Campaigns"
        subtitle="Multi-event campaign management and coordination"
        actions={
          <Button size="sm" asChild>
            <a href="/admin/campaigns">
              <Plus size={16} className="mr-1.5" />
              New Campaign
            </a>
          </Button>
        }
      />

      {campaignCards.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <p className="text-sm text-text-muted mb-4">
            No campaigns created yet. Create one to coordinate events across locations.
          </p>
          <Button variant="outline" size="sm">
            <Plus size={16} className="mr-1.5" />
            Create First Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaignCards.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
