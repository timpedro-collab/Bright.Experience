/**
 * Internal organizer setup console.
 *
 * Everything that used to require SQL to onboard a show organizer, in the
 * order it has to happen: give their people a login, hand them their shows,
 * then put hardware on those shows. The page states what's still missing at
 * the top so nobody hands over a portal that opens empty.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, ExternalLink, Users } from "lucide-react";

import { AdminPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InviteOrganizerForm } from "./InviteOrganizerForm";
import { LinkShowForm } from "./LinkShowForm";
import { ShowSetupCard } from "./ShowSetupCard";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getMachines } from "@/lib/queries/machines";
import {
  getAssignableMachines,
  getLinkableShows,
  getOrganizerSetup,
} from "@/lib/queries/organizer-admin";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Organizer detail",
};

export default async function OrganizerSetupPage({ params }: Props) {
  const { id } = await params;

  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const organizer = await getOrganizerSetup(id);
  if (!organizer) notFound();

  const [linkableShows, assignableMachines, machineCatalog, unread] = await Promise.all([
    getLinkableShows(),
    getAssignableMachines(),
    getMachines(),
    getUnreadCount(user.id),
  ]);

  const machineTypes = (machineCatalog as { id: string; name: string }[]).map((m) => ({
    id: String(m.id),
    name: String(m.name),
  }));

  const deployed = organizer.shows.reduce((total, show) => total + show.machines.length, 0);

  // Stated in blocking order: without a login the portal is unreachable,
  // without a show it's empty, without hardware there's nothing to run.
  const blockers = [
    organizer.team.length === 0 ? "nobody can log in" : null,
    organizer.shows.length === 0 ? "no shows linked" : null,
    organizer.shows.length > 0 && deployed === 0 ? "no machines deployed" : null,
  ].filter(Boolean) as string[];

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Organizers"
      title={organizer.name}
      subtitle={
        blockers.length > 0
          ? `Not ready to hand over yet — ${blockers.join(", ")}.`
          : "Set up and ready to hand over."
      }
      heroRight={
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant="outline"
            className={
              organizer.status === "active"
                ? "border-0 bg-success/10 text-[0.65rem] text-success"
                : "text-[0.65rem]"
            }
          >
            {organizer.status}
          </Badge>
          <Link
            href={`/organizers/${organizer.slug}/shows`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            Open their portal <ExternalLink size={11} />
          </Link>
        </div>
      }
    >
      <div className="space-y-8 py-8">
        <section>
          <EditorialEyebrow>Who can log in</EditorialEyebrow>
          <Card className="mt-4">
            <CardContent className="p-5">
              {organizer.team.length === 0 ? (
                <p className="mb-5 text-xs text-muted-foreground">
                  Nobody has access yet. Invite their event lead first — they land straight in
                  the show portal, not in our internal app.
                </p>
              ) : (
                <ul className="mb-5 divide-y divide-border/50">
                  {organizer.team.map((member) => (
                    <li
                      key={member.profileId}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">
                          {member.name ?? member.email}
                        </p>
                        <p className="text-[0.65rem] text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!member.isActive && (
                          <Badge variant="outline" className="text-[0.65rem]">
                            deactivated
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[0.65rem]">
                          {member.profileRole === "partner_admin" ? "Show organizer" : "Show team"}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-border/50 pt-5">
                <InviteOrganizerForm partnerId={organizer.id} />
              </div>
            </CardContent>
          </Card>
        </section>

        <Hairline className="opacity-60" />

        <section>
          <EditorialEyebrow>Their shows</EditorialEyebrow>
          <Card className="mt-4">
            <CardContent className="p-5">
              <LinkShowForm partnerId={organizer.id} shows={linkableShows} />
            </CardContent>
          </Card>

          {organizer.shows.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays size={12} />
              No shows yet. Link one above and its fleet setup appears here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {organizer.shows.map((show) => (
                <ShowSetupCard
                  key={show.id}
                  show={show}
                  organizerSlug={organizer.slug}
                  assignableMachines={assignableMachines}
                  machineTypes={machineTypes}
                />
              ))}
            </div>
          )}
        </section>

        <Hairline className="opacity-60" />

        <section>
          <EditorialEyebrow>Record</EditorialEyebrow>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-xs lg:grid-cols-4">
            <Fact label="Portal address" value={`/organizers/${organizer.slug}`} />
            <Fact label="Partner code" value={organizer.partnerCode ?? "—"} />
            <Fact label="Main contact" value={organizer.contactName ?? "—"} />
            <Fact label="Contact email" value={organizer.contactEmail ?? "—"} />
          </dl>
          <p className="mt-4 flex items-center gap-1.5 text-[0.65rem] text-muted-foreground">
            <Users size={10} />
            Organizers see aggregate performance for their own shows only — never a lead&apos;s
            name, email, or phone number.
          </p>
        </section>
      </div>
    </AdminPageShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{value}</dd>
    </div>
  );
}
