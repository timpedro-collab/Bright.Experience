/**
 * The Bright.Experience home — every authenticated user lands here.
 *
 * Two distinct surfaces, one chrome:
 *
 *   - Customer (most users): an editorial spread for the featured
 *     event. Full-bleed ridge artwork hero, three editorial columns
 *     ("Waiting on you" · "The Chapters" · "From your team"), and
 *     a small rail of other editions if the customer has more than
 *     one event. Rendered by `<CustomerDashboard>`.
 *
 *   - Internal (Bright.Blue employees): "Your library." — a grid of
 *     every active edition rendered as `<EditionPlate>` cards, each
 *     carrying its own unique ridge fingerprint. Rendered by
 *     `<InternalDashboard>`.
 *
 * This page is a server component: it owns all data fetching and the
 * role branch, then passes plain serializable props into the two
 * dashboard surfaces. Both share `<EditionShell>` as their chrome.
 */
import { redirect } from "next/navigation";

import { getEventsPaginated, type EventFilters } from "@/lib/queries/events";
import { getInternalQueueCounts } from "@/lib/queries/admin-queues";
import { getEventPortfolioStats } from "@/lib/queries/portfolio";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  getOpenTaskCountsForUser,
  getTasksByRole,
  getTaskProgressByEvent,
} from "@/lib/queries/tasks";
import { getTeamForEvent } from "@/lib/queries/team";
import { getCustomerActionItems } from "@/lib/queries/deadlines";
import { getPendingQuotesForCustomer, getUpcomingWalkthroughs } from "@/lib/queries/quotes";
import { getStreak } from "@/app/actions/streak";
import { getUser } from "@/lib/auth";
import { isInternalRole, isPartnerRole } from "@/lib/roles";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenuesByPartner } from "@/lib/queries/venues";
import { parsePage } from "@/lib/pagination";

import { buildFocusItems } from "@/lib/queries/home-focus";
import { pickFeaturedEvent } from "@/components/home/home-helpers";
import { FocusedHome } from "@/components/home/FocusedHome";
import { CustomerDashboard } from "@/components/home/CustomerDashboard";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await getUser();
  if (!user) {
    const { PublicLanding } = await import("@/components/public/PublicLanding");
    return <PublicLanding />;
  }
  if (!user.hasCompletedOnboarding) redirect("/welcome");

  // Partner & venue users don't have a customer/internal home — send them
  // straight to their own portal. Venue-type partners land on their venue
  // runway; resellers/agencies land on the partner dashboard.
  if (isPartnerRole(user.role)) {
    const partner = await getPartnerForUser(user.id);
    if (partner) {
      if (partner.type === "venue") {
        const venues = await getVenuesByPartner(partner.id);
        if (venues[0]?.slug) redirect(`/venues/${venues[0].slug}/dashboard`);
      }
      redirect(`/partners/${partner.slug}/dashboard`);
    }
  }

  const params = await searchParams;
  const isInternal = isInternalRole(user.role);
  const page = parsePage(params);

  const filters: EventFilters = {
    q: typeof params.q === "string" ? params.q : undefined,
    stage: typeof params.stage === "string" ? params.stage : undefined,
    health: typeof params.health === "string" ? params.health : undefined,
    account: typeof params.account === "string" ? params.account : undefined,
  };

  const [eventsResult, unread, roleTaskGroups, streak, queueCounts] = await Promise.all([
    isInternal ? getEventsPaginated(page, undefined, filters) : getEventsPaginated(page),
    getUnreadCount(user.id),
    isInternal ? getTasksByRole(user.role, user.id) : Promise.resolve([]),
    getStreak(),
    isInternal ? getInternalQueueCounts() : Promise.resolve(null),
  ]);
  const events = eventsResult.data;

  const featured = pickFeaturedEvent(events);
  const others = featured ? events.filter((e) => e.id !== featured.id) : [];

  // Featured-event-specific data only fetched if there's something to feature.
  const eventIds = events.map((e) => e.id);
  const [taskCounts, featuredTeam, taskProgress, customerActions] = await Promise.all([
    getOpenTaskCountsForUser(user.id, isInternal, eventIds),
    featured ? getTeamForEvent(featured.id) : Promise.resolve([]),
    getTaskProgressByEvent(eventIds),
    featured && !isInternal ? getCustomerActionItems(featured.id) : Promise.resolve([]),
  ]);

  const totalPages =
    typeof eventsResult?.totalPages === "number" ? eventsResult.totalPages : 0;

  // Internal mode → focused, action-first home. The full event library and
  // by-stage charts now live on /pipeline; this surface stays glanceable.
  if (isInternal) {
    // Single source of portfolio truth (whole portfolio, not the page).
    const [portfolio, walkthroughs] = await Promise.all([
      getEventPortfolioStats(),
      getUpcomingWalkthroughs(),
    ]);
    const focusItems = buildFocusItems({
      role: user.role,
      portfolio,
      queueCounts,
      taskGroups: roleTaskGroups,
      walkthroughs,
    });

    const activeEvents = portfolio.events.filter(
      (e) => e.currentStage !== "complete",
    );
    let stripEvents = activeEvents;
    let stripTitle = "Your portfolio";
    let stripSubtitle: string | undefined = `${activeEvents.length} event${activeEvents.length === 1 ? "" : "s"} in flight`;
    if (user.role === "creative_lead") {
      const creativeEventIds = new Set(roleTaskGroups.map((g) => g.eventId));
      const creatingFor = activeEvents.filter((e) => creativeEventIds.has(e.id));
      stripEvents = creatingFor.length > 0 ? creatingFor : activeEvents;
      stripTitle = "Events you're creating for";
      stripSubtitle = undefined;
    }

    return (
      <FocusedHome
        user={user}
        unread={unread}
        streak={streak}
        focusItems={focusItems}
        stripEvents={stripEvents.slice(0, 8)}
        taskCounts={taskCounts}
        taskProgress={taskProgress}
        stripTitle={stripTitle}
        stripSubtitle={stripSubtitle}
        showStrip={stripEvents.length > 0}
      />
    );
  }

  // A logged-in customer with no event isn't dumped to the public funnel —
  // we show their in-flight proposal (if any) or a warm in-portal discovery.
  const pendingQuotes = !featured
    ? await getPendingQuotesForCustomer(user.email)
    : [];

  // Customer mode → Featured event editorial spread.
  return (
    <CustomerDashboard
      user={user}
      unread={unread}
      streak={streak}
      featured={featured}
      others={others}
      featuredTeam={featuredTeam}
      customerActions={customerActions}
      taskCounts={taskCounts}
      taskProgress={taskProgress}
      totalPages={totalPages}
      page={page}
      pendingQuotes={pendingQuotes}
    />
  );
}
