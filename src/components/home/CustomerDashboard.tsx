/**
 * The customer home surface — an editorial spread for the featured event
 * (hero, KPIs, the three editorial columns, and a rail of other editions),
 * or a warm in-portal holding state when the customer has no live event yet.
 * Pure presentation: the home page server component fetches all data and
 * passes it in as serializable props.
 */
import Link from "next/link";
import {
  CalendarClock,
  ListChecks,
  GitBranch,
  Users,
} from "lucide-react";

import {
  KpiGrid,
  KpiCard,
  GlassCard,
  GlassCardHeader,
} from "@/components/cloud";
import {
  EditionShell,
  EditionChrome,
  EditionFooter,
  RidgeHero,
} from "@/components/brand";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { TourShell } from "@/components/onboarding/TourShell";
import { StreakIndicator } from "@/components/dashboard/StreakIndicator";
import { CustomerActionSummary } from "@/components/events/CustomerActionSummary";
import { CustomerHoldingState } from "@/components/home/CustomerHoldingState";
import { TeamColumn } from "@/components/home/TeamColumn";
import { ProgressColumn } from "@/components/home/ProgressColumn";
import { OtherEventsRail } from "@/components/home/OtherEventsRail";
import {
  timeUntil,
  healthLabel,
  firstName,
} from "@/components/home/home-helpers";

import { STAGE_CONFIG } from "@/types";
import type { Event, EventTeamMember, Stage, User } from "@/types";
import { stageLabelFor, healthLabelFor } from "@/lib/customer-copy";
import type { getCustomerActionItems } from "@/lib/queries/deadlines";
import type { getPendingQuotesForCustomer } from "@/lib/queries/quotes";

interface CustomerDashboardProps {
  user: User;
  unread: number;
  streak: number;
  featured: Event | null;
  others: Event[];
  featuredTeam: EventTeamMember[];
  customerActions: Awaited<ReturnType<typeof getCustomerActionItems>>;
  taskCounts: Record<string, number>;
  taskProgress: Record<string, { completed: number; total: number }>;
  totalPages: number;
  page: number;
  pendingQuotes: Awaited<ReturnType<typeof getPendingQuotesForCustomer>>;
}

export function CustomerDashboard({
  user,
  unread,
  streak,
  featured,
  others,
  featuredTeam,
  customerActions,
  taskCounts,
  taskProgress,
  totalPages,
  page,
  pendingQuotes,
}: CustomerDashboardProps) {
  return (
    <TourShell role={user.role} autoStart={false}>
      <EditionShell>
        <EditionChrome
          breadcrumbs={
            featured
              ? [{ label: featured.name, href: `/events/${featured.id}` }]
              : [{ label: "Home" }]
          }
          rightSlot={
            <>
              <NotificationBell unreadCount={unread} />
              <span className="hidden md:block h-6 w-px bg-border" aria-hidden />
              <UserMenu user={user} />
            </>
          }
        />

        {!featured ? (
          <CustomerHoldingState
            firstName={firstName(user.name)}
            pendingQuotes={pendingQuotes}
          />
        ) : (
          <>
            <RidgeHero
              variant="compact"
              seed={featured.id}
              eyebrow={`Welcome back, ${firstName(user.name)}`}
              title={`${featured.name} is taking shape.`}
              subtitle={(() => {
                const stageLabel = stageLabelFor(featured.currentStage as Stage, true);
                const t = timeUntil(featured);
                if (t === "Live now") return `Live now at ${featured.venueName ?? "your venue"}.`;
                if (t === "Wrapped") return `Wrapped. Reports are landing in your inbox.`;
                return `Currently at ${stageLabel}. Event in ${t}.`;
              })()}
              rightSlot={
                <>
                  <StreakIndicator streak={streak} />
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        healthLabel(featured).tone === "active"
                          ? "size-1.5 rounded-full bg-[var(--color-bb-cyan)]"
                          : "size-1.5 rounded-full bg-[hsl(43_90%_56%)]"
                      }
                      aria-hidden
                    />
                    {healthLabelFor(featured.healthStatus, true)}
                  </span>
                </>
              }
            />

            <div className="space-y-8 py-6" data-tour="featured-event">
              <KpiGrid>
                <KpiCard
                  label="Time to event"
                  value={timeUntil(featured)}
                  icon={CalendarClock}
                  hint={featured.venueName ?? undefined}
                />
                <KpiCard
                  label="Needs you"
                  value={customerActions.length}
                  icon={ListChecks}
                  hint={customerActions.length === 0 ? "all clear" : "open items"}
                />
                <KpiCard
                  label="Stage"
                  value={`${(STAGE_CONFIG[featured.currentStage as Stage]?.order ?? 0) + 1}/10`}
                  icon={GitBranch}
                  hint={stageLabelFor(featured.currentStage as Stage, true)}
                />
                <KpiCard
                  label="Your team"
                  value={featuredTeam.filter((m) => m.status === "approved").length + 1}
                  icon={Users}
                  hint="on this event"
                />
              </KpiGrid>

              {/* The star: what the customer owes, full-width and first. */}
              <GlassCard data-tour="waiting-on-you">
                <GlassCardHeader
                  title="What's needed from you"
                  description={
                    customerActions.length === 0
                      ? "Nothing right now — we'll let you know the moment something needs you."
                      : "Complete these to keep your activation on track"
                  }
                />
                <div className="p-6">
                  <CustomerActionSummary eventId={featured.id} items={customerActions} teaserLimit={6} />
                </div>
              </GlassCard>

              {/* Secondary context, demoted to a calm two-up row. */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <GlassCardHeader title="Progress" />
                  <ProgressColumn event={featured} />
                </GlassCard>

                <GlassCard>
                  <GlassCardHeader title="From your team" />
                  <div className="p-6">
                    <TeamColumn eventId={featured.id} members={featuredTeam} hideEyebrow />
                  </div>
                </GlassCard>
              </div>
            </div>

            {others.length > 0 && (
              <OtherEventsRail
                events={others}
                taskCounts={taskCounts}
                taskProgress={taskProgress}
                totalPages={totalPages}
                page={page}
              />
            )}
          </>
        )}

        <EditionFooter
          rightSlot={
            featured ? (
              <Link
                href={`/events/${featured.id}`}
                data-tour="open-event"
                className="hover:opacity-80 transition-opacity"
              >
                Open this event →
              </Link>
            ) : null
          }
        />
        <CommandPalette />
      </EditionShell>
    </TourShell>
  );
}
