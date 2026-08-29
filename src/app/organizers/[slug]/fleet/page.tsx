/**
 * Organizer portal — every machine across every show, grouped by show.
 *
 * The portfolio-level answer to "where is everything and what is it doing".
 * An organizer running several editions a year wants one list they can scan
 * for units that are still unassigned or standing quiet, without opening each
 * show in turn.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, ChevronRight, MapPin, Handshake } from "lucide-react";

import { PortalPageShell, organizerTabs, organizerRoleLabel } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";

import { requireOrganizerContext } from "@/lib/auth/organizer-portal";
import { getFleetByOrganizer } from "@/lib/queries/organizers";
import { getUnreadCount } from "@/lib/queries/notifications";
import { missionLabel } from "@/lib/fleet-labels";
import { cn } from "@/lib/utils";
import { entityTitle, getPartnerNameForTitle } from "@/lib/queries/page-titles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: entityTitle("Fleet", await getPartnerNameForTitle(slug)) };
}

export default async function OrganizerFleetPage({ params }: Props) {
  const { slug } = await params;
  const { user, partnerId, partnerName } = await requireOrganizerContext(slug);

  const [fleet, unread] = await Promise.all([
    getFleetByOrganizer(partnerId),
    getUnreadCount(user.id),
  ]);

  const shows = Array.from(new Set(fleet.map((m) => m.eventId)));
  const needsSetup = fleet.filter((m) => !m.zone || !m.mission).length;

  return (
    <PortalPageShell
      user={user}
      roleLabel={organizerRoleLabel(user.role)}
      unreadCount={unread}
      scope={partnerName}
      section="Fleet"
      slug={slug}
      tabs={organizerTabs(slug)}
      title="Your fleet"
      subtitle={
        fleet.length === 0
          ? "Machines appear here once they're assigned to one of your shows."
          : `${fleet.length} machine${fleet.length === 1 ? "" : "s"} across ${
              shows.length
            } show${shows.length === 1 ? "" : "s"}${
              needsSetup > 0
                ? ` · ${needsSetup} still needs a zone or a mission`
                : ""
            }.`
      }
    >
      {fleet.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="Your fleet"
          description="Every machine assigned to your shows appears here with its zone, job, and live status. Bright.Blue allocates units when a show is set up — none are assigned yet."
          tone="flat"
        />
      ) : (
        <div className="space-y-8">
          {shows.map((eventId) => {
            const machines = fleet.filter((m) => m.eventId === eventId);
            return (
              <section key={eventId}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {machines[0].showName}
                  </p>
                  <Link
                    href={`/organizers/${slug}/shows/${eventId}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open show
                  </Link>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border/50">
                      {machines.map((machine) => {
                        return (
                          <li key={machine.id}>
                            <Link
                              href={`/organizers/${slug}/shows/${eventId}/machines/${machine.id}`}
                              className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "size-2 shrink-0 rounded-full",
                                      machine.isOnline ? "bg-success" : "bg-warning"
                                    )}
                                    aria-hidden
                                  />
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {machine.nickname ?? machine.serialNumber}
                                  </p>
                                  {machine.sponsorName && (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 text-[0.6rem]"
                                    >
                                      <Handshake size={9} />
                                      {machine.sponsorName}
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-0.5 flex items-center gap-1.5 pl-4 text-xs text-muted-foreground">
                                  <MapPin size={10} />
                                  {machine.zone ?? "No zone set"} ·{" "}
                                  {missionLabel(machine.mission)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-3">
                                {(!machine.zone || !machine.mission) && (
                                  <Badge className="border-0 bg-warning/10 text-[0.6rem] text-warning">
                                    Needs setting up
                                  </Badge>
                                )}
                                <ChevronRight
                                  size={14}
                                  className="text-muted-foreground/60 transition-colors group-hover:text-foreground"
                                />
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            );
          })}
        </div>
      )}
    </PortalPageShell>
  );
}
