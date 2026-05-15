/** Placement management page — calendar view and placement list with create button. */
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { PlacementCalendar } from "@/components/venues/PlacementCalendar";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PlacementsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const placements = await getPlacementsByVenue(venue.id);

  const calendarData = placements.map((p) => ({
    id: p.id,
    startDate: p.start_date,
    endDate: p.end_date ?? undefined,
    status: p.status,
    machineName:
      (p.machine_instances as { nickname?: string })?.nickname ?? undefined,
  }));

  return (
    <AppShell user={user} isInternal={false}>
      <PageHeader
        title="Placements"
        subtitle={`Machine placements at ${venue.name}`}
        breadcrumbs={[
          { label: "Venues", href: "/" },
          { label: venue.name, href: `/venues/${slug}/dashboard` },
          { label: "Placements" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus size={14} />
            New Placement
          </Button>
        }
      />

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
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
