/** Internal campaign management — grid of all campaigns with create option. */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { AdminPageShell } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getCampaigns } from "@/lib/queries/campaigns";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function CampaignsAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const [campaigns, unread] = await Promise.all([
    getCampaigns(),
    getUnreadCount(user.id),
  ]);

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
    }),
  );

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Campaigns"
      title="Campaign orchestration."
      subtitle="Multi-event campaigns with shared targets, learnings, and reporting."
      heroRight={
        <Button size="sm" asChild>
          <Link href="/admin/campaigns/new">
            <Plus size={16} /> New campaign
          </Link>
        </Button>
      }
    >
      <div className="py-8">
        {campaignCards.length === 0 ? (
          <div className="border border-border/60 bg-card/30 rounded-md flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground mb-4">
              No campaigns created yet. Create one to coordinate events
              across locations.
            </p>
            <Button variant="outline" size="sm">
              <Plus size={16} /> Create first campaign
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignCards.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
