/**
 * Internal organizer setup — every show organizer and how far their setup got.
 *
 * The entry point for onboarding an organizer without touching the database:
 * create them here, then finish access, shows, and hardware on their record.
 * Each row calls out what's still missing, because an organizer with no team
 * can't log in and one with no shows sees an empty portal.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, Cpu, Users } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewOrganizerForm } from "./NewOrganizerForm";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  getOrganizerPartners,
  type OrganizerAdminRow,
} from "@/lib/queries/organizer-admin";

export const metadata = {
  title: "Organizers",
};

export default async function AdminOrganizersPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [organizers, unread] = await Promise.all([
    getOrganizerPartners(),
    getUnreadCount(user.id),
  ]);

  const notReady = organizers.filter(setupGaps).length;

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Organizers"
      title="Show organizers."
      subtitle="Set up an organizer, give their team access, and put their shows and machines under them."
      heroRight={
        organizers.length > 0 ? (
          <div className="text-overline text-muted-foreground tabular-nums">
            <span className="text-base font-semibold text-foreground">{organizers.length}</span>{" "}
            organizer{organizers.length === 1 ? "" : "s"}
            {notReady > 0 ? ` · ${notReady} unfinished` : ""}
          </div>
        ) : null
      }
    >
      <div className="space-y-6 py-8">
        <NewOrganizerForm />

        {organizers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No organizers yet"
            description="An organizer is a company that runs shows — Informa, Reed, Clarion. Add one to give their team a portal for their fleet and sponsor inventory."
          />
        ) : (
          <section>
            <EditorialEyebrow>Organizers</EditorialEyebrow>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {organizers.map((organizer) => (
                <OrganizerCard key={organizer.id} organizer={organizer} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AdminPageShell>
  );
}

/**
 * What's still missing before this organizer can be handed over, in the order
 * it blocks them: no login, then nothing to look at, then an empty fleet.
 */
function setupGaps(organizer: OrganizerAdminRow): string | null {
  if (organizer.teamCount === 0) return "Nobody can log in yet";
  if (organizer.showCount === 0) return "No shows linked yet";
  if (organizer.machineCount === 0) return "No machines on their shows yet";
  return null;
}

function OrganizerCard({ organizer }: { organizer: OrganizerAdminRow }) {
  const gap = setupGaps(organizer);

  return (
    <Link href={`/admin/organizers/${organizer.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-[var(--color-bb-cobalt)]/40">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-heading truncate text-sm font-semibold text-foreground">
                {organizer.name}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                /organizers/{organizer.slug}
                {organizer.contactName ? ` · ${organizer.contactName}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
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
              <ArrowRight
                size={14}
                className="text-muted-foreground/60 transition-colors group-hover:text-foreground"
              />
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border/50 pt-4 text-xs">
            <Count icon={Users} label="Team" value={organizer.teamCount} />
            <Count icon={CalendarDays} label="Shows" value={organizer.showCount} />
            <Count icon={Cpu} label="Machines" value={organizer.machineCount} />
          </dl>

          {gap && <p className="mt-3 text-xs text-warning">{gap}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

function Count({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        <Icon size={10} />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
