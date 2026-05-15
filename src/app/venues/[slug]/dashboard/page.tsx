/** Venue operator dashboard — calendar-first view with placements & sponsorship slots */
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Monitor,
  Calendar,
  Ticket,
  Building2,
  Sparkles,
  PlusCircle,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { NextStepCard } from "@/components/layout/NextStepCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

import { getUser } from "@/lib/auth";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatDateMedium } from "@/lib/dates";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VenueDashboardPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const placements = await getPlacementsByVenue(venue.id);
  const unread = await getUnreadCount(user.id);

  const activePlacements = placements.filter((p) => p.status === "active");
  const plannedPlacements = placements.filter((p) => p.status === "planned");

  const allSlots = (
    await Promise.all(activePlacements.map((p) => getSlotsByPlacement(p.id)))
  ).flat();
  const availableSlots = allSlots.filter((s) => s.status === "available");
  const reservedSlots = allSlots.filter((s) => s.status === "reserved");

  // Build a simple 12-week calendar
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeks: { weekStart: Date; placements: typeof placements }[] = [];
  for (let w = 0; w < 12; w++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const hits = placements.filter((p) => {
      const start = new Date(p.start_date);
      const end = p.end_date ? new Date(p.end_date) : new Date(start.getTime() + 7 * 86400000);
      return start < weekEnd && end >= weekStart;
    });
    weeks.push({ weekStart, placements: hits });
  }

  const nextStepDescription = availableSlots.length > 0
    ? `${availableSlots.length} sponsorship slot${availableSlots.length === 1 ? " is" : "s are"} available across your active placements. Open the slot list to invite sponsors.`
    : plannedPlacements.length > 0
      ? `${plannedPlacements.length} placement${plannedPlacements.length === 1 ? " is" : "s are"} planned. Confirm machine arrival dates to keep your runway tight.`
      : "Add your first placement to unlock sponsorship slot sales.";

  return (
    <AppShell user={user} venueSlug={slug} notificationCount={unread}>
      <PageHeader
        eyebrow={venue.address ? `${venue.address}` : "Venue runway"}
        title={venue.name}
        subtitle="Live placements, calendar runway, and available sponsorship slots."
        breadcrumbs={[{ label: "Venues" }, { label: venue.name }]}
        actions={
          <>
            <Button asChild variant="glass" size="sm">
              <Link href={`/venues/${slug}/packages`}>
                <Building2 className="h-4 w-4" /> Packages
              </Link>
            </Button>
            <Button asChild variant="brand" size="sm">
              <Link href={`/venues/${slug}/placements`}>
                <PlusCircle className="h-4 w-4" /> New placement
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <NextStepCard
          eyebrow="Your next step"
          title={availableSlots.length > 0
            ? "You have sponsorship slots ready to sell"
            : plannedPlacements.length > 0
              ? "Lock in your planned placements"
              : "Add your first placement"}
          description={nextStepDescription}
          primaryAction={{
            label: availableSlots.length > 0 ? "Manage slots" : "Open placements",
            href: availableSlots.length > 0
              ? `/venues/${slug}/sponsorships`
              : `/venues/${slug}/placements`,
          }}
          secondaryAction={{ label: "View packages", href: `/venues/${slug}/packages` }}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3 rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,50%,9%)] px-6 py-4">
        <CompactStat
          icon={Monitor}
          label="Active placements"
          value={activePlacements.length}
          tone={activePlacements.length > 0 ? "success" : "default"}
        />
        <CompactStat
          icon={Calendar}
          label="Planned"
          value={plannedPlacements.length}
          tone={plannedPlacements.length > 0 ? "info" : "default"}
        />
        <CompactStat
          icon={Ticket}
          label="Available slots"
          value={availableSlots.length}
          tone={availableSlots.length > 0 ? "warning" : "default"}
        />
        <CompactStat
          icon={Sparkles}
          label="Reserved"
          value={reservedSlots.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card tone="subtle" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>12-week runway</CardTitle>
            <span className="text-overline text-muted-foreground">
              From today
            </span>
          </CardHeader>
          <CardContent>
            {placements.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No placements scheduled"
                description="Add a placement to start seeing it on your runway."
                action={{ label: "Add a placement", href: `/venues/${slug}/placements` }}
                size="sm"
              />
            ) : (
              <div className="space-y-2">
                {weeks.map((week, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="w-20 shrink-0">
                      <p className="text-overline text-muted-foreground">Wk {idx + 1}</p>
                      <p className="text-sm text-foreground tabular-nums">
                        {formatDateMedium(week.weekStart.toISOString())}
                      </p>
                    </div>
                    <div className="flex-1">
                      {week.placements.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Open availability</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {week.placements.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/8 px-2 py-0.5 text-xs text-foreground"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(223,94%,53%,0.7)]" />
                              {(p.machine_instances as { nickname?: string })?.nickname ?? "Machine"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card tone="subtle">
          <CardHeader className="pb-3">
            <CardTitle>Venue details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow icon={MapPin} label="Address" value={venue.address || "—"} />
            <DetailRow icon={Building2} label="Postcode" value={venue.postcode || "—"} />
            <DetailRow
              icon={Sparkles}
              label="Type"
              value={
                <Badge variant="outline" className="text-[10px]">
                  {venue.venue_type ? venue.venue_type.replace(/_/g, " ") : "Other"}
                </Badge>
              }
            />
            <DetailRow
              icon={Ticket}
              label="Capacity"
              value={venue.capacity ? venue.capacity.toLocaleString() : "—"}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2 last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon size={14} />
        {label}
      </span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

const COMPACT_TONES: Record<
  "default" | "success" | "warning" | "info",
  string
> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

function CompactStat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "info";
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-muted-foreground" />
      <div>
        <p className="text-overline text-muted-foreground leading-none">{label}</p>
        <p className={`mt-1 text-xl font-semibold tabular-nums leading-none ${COMPACT_TONES[tone]}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
