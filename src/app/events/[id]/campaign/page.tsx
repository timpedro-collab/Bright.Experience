/** Campaign context page for an individual event — linked campaigns and rebook options. */
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Layers, Plus, Copy } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getEventById } from "@/lib/queries/events";
import { getCampaignsForEvent, getCampaigns } from "@/lib/queries/campaigns";
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
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Campaign"
      title="The wider picture."
      subtitle="See how this activation fits into wider campaigns and explore opportunities to rebook."
      heroRight={
        isInternal ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/admin/campaigns`}>
                <Plus size={14} /> Create campaign
              </a>
            </Button>
            <Button variant="brand" size="sm" asChild>
              <a href={`/events/${id}`}>
                <Copy size={14} /> Duplicate event
              </a>
            </Button>
          </div>
        ) : null
      }
    >
      <section className="py-8">
        <EditorialEyebrow accent>Linked campaigns</EditorialEyebrow>
        {campaignLinks.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignLinks.map((link) => {
              const c = link.campaigns as unknown as Record<
                string,
                unknown
              > | null;
              if (!c) return null;
              const status = String(c.status ?? "draft");
              const cfg = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.draft;
              return (
                <div
                  key={String(c.id)}
                  className="border border-border/60 bg-card/30 rounded-md p-5 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {String(c.name)}
                    </h3>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-overline text-muted-foreground">
                    {c.start_date
                      ? `${c.start_date} → ${c.end_date ?? "TBD"}`
                      : "No dates set"}
                  </p>
                  {isInternal && (
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <a href={`/admin/campaigns/${c.id}`}>View campaign</a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 border border-border/40 bg-card/20 rounded-md flex flex-col items-center justify-center py-12">
            <Layers size={32} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              This event is not part of any campaign yet.
            </p>
            {isInternal && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/campaigns">
                  <Plus size={14} /> Add to campaign
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>

      {isInternal && allCampaigns.length > 0 && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <EditorialEyebrow>Available campaigns</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {allCampaigns
                .filter(
                  (c) =>
                    !campaignLinks.some((l) => {
                      const linked = l.campaigns as unknown as Record<
                        string,
                        unknown
                      > | null;
                      return linked && String(linked.id) === c.id;
                    }),
                )
                .slice(0, 6)
                .map((c) => (
                  <div
                    key={c.id}
                    className="border border-border/60 bg-card/30 rounded-md p-4"
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.name}
                    </p>
                    <p className="text-overline text-muted-foreground mt-1 capitalize">
                      {c.status}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}
    </EventPageShell>
  );
}
