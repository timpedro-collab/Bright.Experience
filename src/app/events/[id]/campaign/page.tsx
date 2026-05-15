/** Campaign context page for an individual event — shows linked campaigns and rebook options. */
import { redirect, notFound } from "next/navigation";
import { Layers, Plus, Copy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getEventById } from "@/lib/queries/events";
import { getCampaignsForEvent } from "@/lib/queries/campaigns";
import { getCampaigns } from "@/lib/queries/campaigns";
import { getUnreadCount } from "@/lib/queries/notifications";

const STATUS_VARIANTS: Record<
  string,
  { label: string; variant: "default" | "info" | "success" | "warning" | "muted" }
> = {
  draft: { label: "Draft", variant: "muted" },
  active: { label: "Active", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  archived: { label: "Archived", variant: "muted" },
};

export default async function EventCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, unread] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  const campaignLinks = await getCampaignsForEvent(id);
  const allCampaigns = isInternal ? await getCampaigns() : [];

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Campaign" />
      <PageHeader
        eyebrow="Multi-event view"
        title="Campaign"
        subtitle="See how this activation fits into wider campaigns and explore opportunities to rebook."
        actions={
          isInternal ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/admin/campaigns`}>
                  <Plus size={14} />
                  Create campaign
                </a>
              </Button>
              <Button variant="brand" size="sm" asChild>
                <a href={`/events/${id}`}>
                  <Copy size={14} />
                  Duplicate event
                </a>
              </Button>
            </div>
          ) : undefined
        }
      />

      {campaignLinks.length > 0 ? (
        <div className="space-y-3 mb-8">
          <h2 className="text-heading text-base font-semibold text-foreground">
            Linked campaigns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignLinks.map((link) => {
              const c = link.campaigns as unknown as Record<string, unknown> | null;
              if (!c) return null;
              const status = String(c.status ?? "draft");
              const cfg = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.draft;
              return (
                <Card key={String(c.id)} tone="subtle" interactive>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {String(c.name)}
                    </CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {c.start_date ? `${c.start_date} — ${c.end_date ?? "TBD"}` : "No dates set"}
                    </p>
                    {isInternal && (
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <a href={`/admin/campaigns/${c.id}`}>View campaign</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card tone="subtle" className="mb-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers size={40} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              This event is not part of any campaign yet.
            </p>
            {isInternal && (
              <Button variant="outline" size="sm" asChild>
                <a href="/admin/campaigns">
                  <Plus size={14} />
                  Add to campaign
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {isInternal && allCampaigns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-heading text-base font-semibold text-foreground">
            Available campaigns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {allCampaigns
              .filter(
                (c) => !campaignLinks.some((l) => {
                  const linked = l.campaigns as unknown as Record<string, unknown> | null;
                  return linked && String(linked.id) === c.id;
                })
              )
              .slice(0, 6)
              .map((c) => (
                <Card key={c.id} tone="subtle" className="p-4">
                  <p className="text-sm font-medium text-foreground truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {c.status}
                  </p>
                </Card>
              ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
