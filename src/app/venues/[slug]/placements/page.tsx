/** Placement management page — calendar view and placement list with create button. */
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { PortalPageShell, venueTabs } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PlacementCalendar } from "@/components/venues/PlacementCalendar";

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "muted"> = {
  active: "success",
  planned: "info",
  completed: "muted",
  cancelled: "warning",
};

export default async function PlacementsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const [placements, unread] = await Promise.all([
    getPlacementsByVenue(venue.id),
    getUnreadCount(user.id),
  ]);

  const calendarData = placements.map((p) => ({
    id: p.id,
    startDate: p.start_date,
    endDate: p.end_date ?? undefined,
    status: p.status,
    machineName:
      (p.machine_instances as { nickname?: string })?.nickname ?? undefined,
  }));

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={venue.name}
      section="Placements"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Placements"
      subtitle={`Machine placements at ${venue.name}`}
      heroRight={
        <Button size="sm" className="gap-2">
          <Plus size={14} />
          New placement
        </Button>
      }
    >
      <div className="space-y-6">
        <PlacementCalendar placements={calendarData} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              All Placements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {placements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No placements created yet. Click &ldquo;New Placement&rdquo; to
                get started.
              </p>
            ) : (
              <div className="space-y-3">
                {placements.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] p-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {(p.machine_instances as { nickname?: string })
                          ?.nickname ?? "Unassigned Machine"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.start_date).toLocaleDateString("en-GB")}
                        {p.end_date &&
                          ` — ${new Date(p.end_date).toLocaleDateString("en-GB")}`}
                      </p>
                      {p.notes && (
                        <p className="text-xs text-muted-foreground">
                          {p.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "muted"}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalPageShell>
  );
}
