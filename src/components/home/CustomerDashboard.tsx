/**
 * The customer home surface — an editorial spread for the featured event
 * (hero, KPIs, the three editorial columns, and a rail of other editions),
 * or a warm in-portal holding state when the customer has no live event yet.
 * Pure presentation: the home page server component fetches all data and
 * passes it in as serializable props.
 */
import Link from "next/link";

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
import { CustomerEventBody } from "@/components/events/CustomerEventBody";
import { CustomerHoldingState } from "@/components/home/CustomerHoldingState";
import { OtherEventsRail } from "@/components/home/OtherEventsRail";
import { RecentActivity } from "@/components/home/RecentActivity";
import { healthLabel, firstName } from "@/components/home/home-helpers";

import type {
  Event,
  EventTeamMember,
  Milestone,
  Notification,
  User,
} from "@/types";
import { customerStatusLine, healthLabelFor } from "@/lib/customer-copy";
import type { NextStep } from "@/lib/event-next-step";
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
  /** Resolved single next step for the featured event — powers OverToYou. */
  nextStep?: NextStep | null;
  /** Milestones for the featured event — drives the journey steps + next-up. */
  featuredMilestones?: Milestone[];
  /**
   * Non-actionable recent notifications — the "things that happened" half of
   * the Needs-you / Recent-activity split (R1). Actionable items live in
   * OverToYou; these are informational only.
   */
  recentActivity?: Notification[];
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
  nextStep = null,
  featuredMilestones = [],
  recentActivity = [],
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
              subtitle={customerStatusLine(featured)}
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

            {/* One calm body, identical to the event overview — action block,
                journey steps, team, and quiet disclosures. The overview-only
                "The numbers" disclosure is omitted here (no extra fetches). */}
            <div data-tour="featured-event">
              <CustomerEventBody
                eventId={featured.id}
                event={featured}
                milestones={featuredMilestones}
                items={customerActions}
                nextStep={nextStep}
                teamMembers={featuredTeam}
              />
            </div>

            {/* "Things that happened" — quiet, below everything actionable. */}
            <div className="pb-6">
              <RecentActivity items={recentActivity} />
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
