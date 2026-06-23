/** Campaign context page — linked campaigns, rebook options, and campaign picker. */
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Layers, Plus, MessageSquare } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DuplicateEventButton } from "@/components/campaigns/DuplicateEventButton";
import { AddToCampaignPicker } from "@/components/campaigns/AddToCampaignPicker";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
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
  // Campaign grouping/management is an Events Lead / Admin tool — it groups
  // and rebooks events across the account. Not relevant to the specialist
  // delivery roles, so it's scoped to full-access roles only.
  if (!canViewSection(user.role, "campaign")) redirect(`/events/${id}`);
  const [event, unread] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  const campaignLinks = await getCampaignsForEvent(id);
  const allCampaigns = isInternal ? await getCampaigns() : [];

  const linkedIds = campaignLinks
    .map((l) => {
      const c = l.campaigns as unknown as Record<string, unknown> | null;
      return c ? String(c.id) : null;
    })
    .filter(Boolean) as string[];

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Campaign"
      title="The wider picture."
      subtitle="See how this activation fits into wider campaigns and explore opportunities to rebook."
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={
        isInternal ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/campaigns/new">
                <Plus size={14} /> Create campaign
              </Link>
            </Button>
            <DuplicateEventButton eventId={id} />
          </div>
        ) : null
      }
    >
      <CampaignLinksSection
        campaignLinks={campaignLinks}
        isInternal={isInternal}
        eventId={id}
        allCampaigns={allCampaigns}
        linkedIds={linkedIds}
      />

      {isInternal && allCampaigns.length > 0 && (
        <AvailableCampaignsSection
          allCampaigns={allCampaigns}
          linkedIds={linkedIds}
        />
      )}

      {!isInternal && (
        <>
          <Hairline className="opacity-60" />
          <section className="py-8">
            <div className="border border-border/40 bg-card/20 rounded-md flex flex-col items-center justify-center py-12">
              <MessageSquare size={28} className="text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Interested in rebooking this activation or running a
                multi-event campaign? Talk to your account manager — they
                can set everything up for you.
              </p>
            </div>
          </section>
        </>
      )}
    </EventPageShell>
  );
}

/* --- Extracted sub-sections to stay under 200 lines --- */

function CampaignLinksSection({
  campaignLinks,
  isInternal,
  eventId,
  allCampaigns,
  linkedIds,
}: {
  campaignLinks: Awaited<ReturnType<typeof getCampaignsForEvent>>;
  isInternal: boolean;
  eventId: string;
  allCampaigns: Awaited<ReturnType<typeof getCampaigns>>;
  linkedIds: string[];
}) {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between gap-4 mb-1">
        <EditorialEyebrow accent>Linked campaigns</EditorialEyebrow>
        {isInternal && (
          <AddToCampaignPicker
            eventId={eventId}
            campaigns={allCampaigns.map((c) => ({
              id: c.id,
              name: c.name,
              status: c.status,
            }))}
            linkedCampaignIds={linkedIds}
          />
        )}
      </div>
      {campaignLinks.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaignLinks.map((link) => {
            const c = link.campaigns as unknown as Record<string, unknown> | null;
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
                    <Link href={`/admin/campaigns/${c.id}`}>View campaign</Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 border border-border/40 bg-card/20 rounded-md flex flex-col items-center justify-center py-12">
          <Layers size={32} className="text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            This event is not part of any campaign yet.
          </p>
        </div>
      )}
    </section>
  );
}

function AvailableCampaignsSection({
  allCampaigns,
  linkedIds,
}: {
  allCampaigns: Awaited<ReturnType<typeof getCampaigns>>;
  linkedIds: string[];
}) {
  const unlinked = allCampaigns
    .filter((c) => !linkedIds.includes(c.id))
    .slice(0, 6);

  if (unlinked.length === 0) return null;

  return (
    <>
      <Hairline className="opacity-60" />
      <section className="py-8">
        <EditorialEyebrow>Available campaigns</EditorialEyebrow>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {unlinked.map((c) => (
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
  );
}
