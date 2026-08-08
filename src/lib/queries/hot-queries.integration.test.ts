/**
 * The hottest read queries, executed against local Postgres.
 *
 * Every page in the app is built from these functions. The unit suite drives
 * them through a chainable test double, which happily accepts a `select()`
 * naming a column that doesn't exist, an embed PostgREST can't resolve, or an
 * RPC nobody migrated — the exact bugs that shipped. Here each one makes a real
 * request under real RLS, and the mocked `logQueryError` turns a swallowed
 * failure into a failing test.
 *
 * Requires a live local stack: `npm run db:local && npm run test:integration`.
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  adminClient,
  hasLocalSupabase,
  NO_LOCAL_DB,
  queryErrors,
  resetQueryErrors,
  setActiveClient,
  signInAs,
} from "@/test/integration/harness";

const describeIntegration = hasLocalSupabase() ? describe : describe.skip;
if (!hasLocalSupabase()) console.warn(`[integration] skipped: ${NO_LOCAL_DB}`);

/** Ids read from the seeded database so the queries have real rows to find. */
interface Fixtures {
  eventId: string;
  accountId: string;
  userId: string;
  partnerId: string | null;
  assetId: string | null;
  quoteId: string | null;
  placementId: string | null;
  machineSlug: string | null;
  packageSlug: string | null;
  gameSlug: string | null;
  venueSlug: string | null;
}

async function loadFixtures(admin: SupabaseClient): Promise<Fixtures> {
  const first = async (table: string, columns: string) => {
    const { data, error } = await admin
      .from(table)
      .select(columns)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`fixture read on ${table} failed: ${error.message}`);
    return data as Record<string, string> | null;
  };

  const event = await first("events", "id, account_id");
  if (!event) {
    throw new Error("no seeded events — run `npm run db:seed`");
  }
  const profile = await first("profiles", "id");

  return {
    eventId: event.id,
    accountId: event.account_id,
    userId: profile!.id,
    partnerId: (await first("partners", "id"))?.id ?? null,
    assetId: (await first("assets", "id"))?.id ?? null,
    quoteId: (await first("quotes", "id"))?.id ?? null,
    placementId: (await first("placements", "id"))?.id ?? null,
    machineSlug: (await first("machines", "slug"))?.slug ?? null,
    packageSlug: (await first("packages", "slug"))?.slug ?? null,
    gameSlug: (await first("games", "slug"))?.slug ?? null,
    venueSlug: (await first("venues", "slug"))?.slug ?? null,
  };
}

describeIntegration("hot read queries against local Postgres", () => {
  let fixtures: Fixtures;

  beforeAll(async () => {
    fixtures = await loadFixtures(adminClient());
    // Internal persona: the widest RLS scope, so a query that fails here fails
    // on its own shape rather than on permissions.
    setActiveClient(await signInAs("internal"));
  });

  beforeEach(() => {
    resetQueryErrors();
  });

  /**
   * Each case awaits one query function. The assertion is uniform: it resolved,
   * and nothing was reported to `logQueryError` — i.e. PostgREST accepted the
   * request. Shape assertions stay in the unit suite; this suite is about the
   * request being valid at all.
   */
  const cases: Array<[name: string, run: () => Promise<unknown>]> = [
    // --- events and the delivery portal -----------------------------
    ["getEvents", async () => (await import("./events")).getEvents()],
    [
      "getEventsPaginated",
      async () => (await import("./events")).getEventsPaginated(1, 10),
    ],
    [
      "getEventsPaginated with a search term",
      async () =>
        (await import("./events")).getEventsPaginated(1, 10, { q: "co" }),
    ],
    [
      "getEventsPaginated with stage and health filters",
      async () =>
        (await import("./events")).getEventsPaginated(1, 10, {
          stage: "creative_assets",
          health: "green",
        }),
    ],
    [
      "getEventById",
      async () => (await import("./events")).getEventById(fixtures.eventId),
    ],
    ["getPipelineEvents", async () => (await import("./pipeline")).getPipelineEvents()],
    [
      "getPipelineEvents with filters",
      async () =>
        (await import("./pipeline")).getPipelineEvents({
          health: "amber",
          stage: "event_live",
        }),
    ],
    [
      "getPipelineEvents with a search term",
      async () => (await import("./pipeline")).getPipelineEvents({ q: "co" }),
    ],
    [
      "getEventSectionStatus",
      async () =>
        (await import("./event-section-status")).getEventSectionStatus(
          fixtures.eventId
        ),
    ],
    [
      "getDeadlinesByEvent",
      async () =>
        (await import("./deadlines")).getDeadlinesByEvent(fixtures.eventId),
    ],
    [
      "getCustomerActionItems",
      async () =>
        (await import("./deadlines")).getCustomerActionItems(fixtures.eventId),
    ],
    [
      "getMilestonesByEvent",
      async () =>
        (await import("./milestones")).getMilestonesByEvent(fixtures.eventId),
    ],
    [
      "getApprovalsByEvent",
      async () =>
        (await import("./approvals")).getApprovalsByEvent(fixtures.eventId),
    ],
    [
      "getQAItemsByEvent",
      async () => (await import("./qa-items")).getQAItemsByEvent(fixtures.eventId),
    ],
    [
      "getLogisticsByEvent",
      async () =>
        (await import("./logistics")).getLogisticsByEvent(fixtures.eventId),
    ],
    [
      "getBriefingResponsesForEvent",
      async () =>
        (await import("./briefing")).getBriefingResponsesForEvent(
          fixtures.eventId
        ),
    ],
    [
      "getMessagesByEvent",
      async () => (await import("./messages")).getMessagesByEvent(fixtures.eventId),
    ],
    [
      "getAuditEntriesForEvent",
      async () =>
        (await import("./audit")).getAuditEntriesForEvent(fixtures.eventId),
    ],
    [
      "getTeamForEvent",
      async () => (await import("./team")).getTeamForEvent(fixtures.eventId),
    ],
    [
      "getStageTransitions",
      async () =>
        (await import("./stage-transitions")).getStageTransitions(
          fixtures.eventId
        ),
    ],

    // --- tasks and the inbox ----------------------------------------
    [
      "getTasksAssignedToUser",
      async () => (await import("./tasks")).getTasksAssignedToUser(fixtures.userId),
    ],
    [
      "getTasksAssignedToUser including recently completed",
      async () =>
        (await import("./tasks")).getTasksAssignedToUser(fixtures.userId, {
          includeCompletedSince: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }),
    ],
    [
      "getTasksByRole",
      async () => (await import("./tasks")).getTasksByRole("admin", fixtures.userId),
    ],

    // --- assets and creative ----------------------------------------
    [
      "getAssetsByEvent",
      async () => (await import("./assets")).getAssetsByEvent(fixtures.eventId),
    ],
    [
      "getAssetsPendingReviewPaginated",
      async () => (await import("./assets")).getAssetsPendingReviewPaginated(1, 10),
    ],

    // --- reporting and metrics --------------------------------------
    [
      "getLeadAggregates",
      async () => (await import("./leads")).getLeadAggregates(fixtures.eventId),
    ],
    [
      "getLeadsByEventPaginated",
      async () =>
        (await import("./leads")).getLeadsByEventPaginated(fixtures.eventId, 1, 10),
    ],
    [
      "getTelemetryByEvent",
      async () =>
        (await import("./telemetry")).getTelemetryByEvent(fixtures.eventId),
    ],
    [
      "getEventMetricTotals",
      async () =>
        (await import("./event-metrics")).getEventMetricTotals(fixtures.eventId),
    ],
    ["getBenchmarks", async () => (await import("./benchmarks")).getBenchmarks()],
    [
      "getEventReports",
      async () =>
        (await import("./event-reports")).getEventReports(fixtures.eventId),
    ],
    [
      "getEventPortfolioStats",
      async () => (await import("./portfolio")).getEventPortfolioStats(),
    ],
    [
      "getAggregateMetrics",
      async () =>
        (await import("./aggregate-metrics")).getAggregateMetrics(
          fixtures.accountId,
          "2020-01-01",
          "2030-01-01"
        ),
    ],

    // --- internal dashboards ----------------------------------------
    [
      "getInternalQueueCounts",
      async () => (await import("./admin-queues")).getInternalQueueCounts(),
    ],
    [
      "getStuckCustomerQueueItems",
      async () => (await import("./admin-queues")).getStuckCustomerQueueItems(),
    ],
    [
      "getProfilesPaginated",
      async () => (await import("./admin")).getProfilesPaginated(1, "a"),
    ],
    [
      "getAccountsPaginated",
      async () => (await import("./admin")).getAccountsPaginated(1),
    ],
    [
      "getAccountDetail (count_by_account RPC)",
      async () => (await import("./admin")).getAccountDetail(fixtures.accountId),
    ],
    [
      "getQuotesPaginated",
      async () => (await import("./quotes")).getQuotesPaginated(1, 10),
    ],
    [
      "getUpcomingWalkthroughs",
      async () => (await import("./quotes")).getUpcomingWalkthroughs(),
    ],
    [
      "getPartnersPaginated",
      async () => (await import("./partners")).getPartnersPaginated(1, 10),
    ],
    [
      "getNotificationsByUserPaginated",
      async () =>
        (await import("./notifications")).getNotificationsByUserPaginated(
          fixtures.userId,
          1,
          10
        ),
    ],
    [
      "getUnreadCount",
      async () => (await import("./notifications")).getUnreadCount(fixtures.userId),
    ],

    // --- catalogue --------------------------------------------------
    ["getMachines", async () => (await import("./machines")).getMachines()],
    ["getPackages", async () => (await import("./packages")).getPackages()],
    ["getGames", async () => (await import("./games")).getGames()],
    ["getLocations", async () => (await import("./locations")).getLocations()],
    ["getCaseStudies", async () => (await import("./case-studies")).getCaseStudies()],
    ["getTemplates", async () => (await import("./templates")).getTemplates()],

    // --- fleet, venues, sponsorship ---------------------------------
    [
      "getFleetByEvent",
      async () =>
        (await import("./machine-instances")).getFleetByEvent(fixtures.eventId),
    ],
    [
      "getMachineInstancesByEvent",
      async () =>
        (await import("./machine-instances")).getMachineInstancesByEvent(
          fixtures.eventId
        ),
    ],
    ["getVenues", async () => (await import("./venues")).getVenues()],
    [
      "getActivePlacements",
      async () => (await import("./placements")).getActivePlacements(),
    ],
    [
      "getAvailableSlots",
      async () => (await import("./sponsorship-slots")).getAvailableSlots(),
    ],
    [
      "getSlotsByEvent",
      async () => (await import("./organizers")).getSlotsByEvent(fixtures.eventId),
    ],
    [
      "getFleetBreakdownForShow",
      async () =>
        (await import("./organizers")).getFleetBreakdownForShow(fixtures.eventId),
    ],
  ];

  it.each(cases)("%s reaches Postgres without error", async (_name, run) => {
    await expect(run()).resolves.not.toThrow();
    expect(queryErrors()).toEqual([]);
  });

  it("runs organizer-scoped queries when a partner is seeded", async () => {
    if (!fixtures.partnerId) return;
    const organizers = await import("./organizers");

    await organizers.getShowsByOrganizer(fixtures.partnerId);
    await organizers.getFleetByOrganizer(fixtures.partnerId);
    await organizers.getSlotsByOrganizer(fixtures.partnerId);

    expect(queryErrors()).toEqual([]);
  });

  it("runs slug lookups for every seeded catalogue entry", async () => {
    const { machineSlug, packageSlug, gameSlug, venueSlug } = fixtures;
    if (machineSlug) {
      await (await import("./machines")).getMachineBySlug(machineSlug);
    }
    if (packageSlug) {
      await (await import("./packages")).getPackageBySlug(packageSlug);
    }
    if (gameSlug) {
      await (await import("./games")).getGameBySlug(gameSlug);
    }
    if (venueSlug) {
      await (await import("./venues")).getVenueBySlug(venueSlug);
    }

    expect(queryErrors()).toEqual([]);
  });

  it("scopes a customer to their own account", async () => {
    setActiveClient(await signInAs("customer"));
    try {
      const { getEvents } = await import("./events");
      const events = await getEvents();

      expect(queryErrors()).toEqual([]);
      expect(events.length).toBeGreaterThan(0);
      expect(new Set(events.map((e) => e.accountId)).size).toBe(1);
    } finally {
      setActiveClient(await signInAs("internal"));
    }
  });
});
