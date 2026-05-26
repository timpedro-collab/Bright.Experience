/**
 * The Bright.Experience home — every authenticated user lands here.
 *
 * Two distinct surfaces, one chrome:
 *
 *   - Customer (most users): an editorial spread for the featured
 *     event. Full-bleed ridge artwork hero, three editorial columns
 *     ("Waiting on you" · "The Chapters" · "From your team"), and
 *     a small rail of other editions if the customer has more than
 *     one event.
 *
 *   - Internal (Bright.Blue employees): "Your library." — a grid of
 *     every active edition rendered as `<EditionPlate>` cards, each
 *     carrying its own unique ridge fingerprint.
 *
 * Both modes share `<EditionShell>` as their outer chrome, which
 * gives us the brand mark, breadcrumbs, theme-awareness, command
 * palette, hairlines, and footer band without per-page boilerplate.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  EditionPlate,
  RidgeHero,
  ThreeColumn,
  EditorialEyebrow,
  Hairline,
  type PlateStatusTone,
} from "@/components/brand";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { CommandPalette } from "@/components/layout/CommandPalette";

import { getEvents } from "@/lib/queries/events";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getOpenTaskCountsForUser, getTasksByEvent } from "@/lib/queries/tasks";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { STAGE_CONFIG } from "@/types";
import type { Event, Stage, Task } from "@/types";

/**
 * Pick the event the customer most wants to see first. We prefer:
 *   1) anything currently blocked (red)
 *   2) the closest upcoming event still in delivery
 *   3) the most recently active event we have
 */
function pickFeaturedEvent(events: Event[]): Event | null {
  if (events.length === 0) return null;
  const blocked = events.find((e) => e.healthStatus === "red");
  if (blocked) return blocked;
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.eventDateStart).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDateStart).getTime() -
        new Date(b.eventDateStart).getTime(),
    )[0];
  return upcoming ?? events[0];
}

/**
 * Render-safe time-until phrase. Returns `"26 days · 06 hours"` style
 * strings, or `"Live now"` if we're between start and end, or
 * `"Wrapped"` if the event is already over.
 */
function timeUntil(event: Event): string {
  const start = new Date(event.eventDateStart).getTime();
  const end = new Date(event.eventDateEnd ?? event.eventDateStart).getTime();
  const now = Date.now();
  if (now >= start && now <= end) return "Live now";
  if (now > end) return "Wrapped";
  const diffMs = start - now;
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  return `${days}d · ${String(hours).padStart(2, "0")}h`;
}

/**
 * Map an event's health into a tone for the on-track pill.
 */
function healthLabel(event: Event): {
  label: string;
  tone: PlateStatusTone;
} {
  if (event.healthStatus === "red")
    return { label: "Blocked", tone: "warning" };
  if (event.healthStatus === "amber")
    return { label: "At risk", tone: "warning" };
  if (event.currentStage === "event_live")
    return { label: "Live", tone: "live" };
  if (event.currentStage === "complete" || event.currentStage === "reporting")
    return { label: "Wrap", tone: "wrap" };
  return { label: "On track", tone: "active" };
}

/**
 * Sequence of operational stages in the order they happen, used by the
 * Progress column to show the customer where they are and what's next.
 */
const STAGE_ORDER: Stage[] = [
  "confirmed",
  "kickoff_complete",
  "creative_assets",
  "approvals",
  "build_configuration",
  "qa_readiness",
  "logistics_confirmed",
  "event_live",
  "reporting",
  "complete",
];

/**
 * Return the current stage plus the next two upcoming stages. We
 * deliberately limit to three rows so the column has the same calm
 * editorial density as the "Waiting on you" and "From your team"
 * columns — no chapter narrative, no Roman numerals, just the next
 * few real operational stages.
 */
function getProgressRows(event: Event): Array<{
  id: Stage;
  label: string;
  status: "in progress" | "up next" | "complete";
  active: boolean;
}> {
  const currentIdx = STAGE_ORDER.indexOf(event.currentStage as Stage);
  if (currentIdx === -1) return [];
  return STAGE_ORDER.slice(currentIdx, currentIdx + 3).map((stage, i) => ({
    id: stage,
    label: STAGE_CONFIG[stage]?.label ?? stage,
    status: i === 0 ? "in progress" : "up next",
    active: i === 0,
  }));
}

/**
 * The "Waiting on you" column for the customer view. Pulls the next
 * three customer-visible open tasks and renders them as a small list
 * of editorial line items, each linking back to the event task view.
 */
function WaitingColumn({
  eventId,
  tasks,
}: {
  eventId: string;
  tasks: Task[];
}) {
  const open = tasks
    .filter(
      (t) =>
        t.customerVisible &&
        t.status !== "complete" &&
        t.status !== "skipped",
    )
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <EditorialEyebrow accent>Waiting on you</EditorialEyebrow>
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing on your plate right now. Your team will reach out when
          they need you.
        </p>
      ) : (
        <ul className="flex flex-col">
          {open.map((task) => (
            <li
              key={task.id}
              className="flex items-start justify-between gap-3 border-b border-border/40 py-3 last:border-0"
            >
              <span className="text-sm text-foreground leading-snug">
                {task.title}
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-[var(--color-bb-cobalt)] mt-0.5"
                aria-hidden
              />
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/events/${eventId}/actions`}
        className="inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 italic font-medium not-italic"
      >
        Go to your queue →
      </Link>
    </div>
  );
}

/**
 * The "From your team" column. Today we surface the default account
 * manager plus two placeholder roles; when a real team roster lands
 * this maps 1:1.
 */
function TeamColumn({ eventId }: { eventId: string }) {
  const team = [
    {
      initial: "S",
      name: DEFAULT_ACCOUNT_MANAGER.fullName,
      title: "Account Manager",
    },
    { initial: "C", name: "Casey Wong", title: "Production Lead" },
    { initial: "M", name: "Mira Patel", title: "Brand Strategist" },
  ];
  return (
    <div className="space-y-4">
      <EditorialEyebrow accent>From your team</EditorialEyebrow>
      <ul className="flex flex-col gap-3">
        {team.map((m) => (
          <li key={m.name} className="flex items-center gap-3">
            <span className="flex items-center justify-center size-8 rounded-full bg-card border border-border text-overline text-foreground">
              {m.initial}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">
                {m.name}
              </span>
              <span className="text-overline text-muted-foreground">
                {m.title}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={`/events/${eventId}/communications`}
        className="inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
      >
        Message your team →
      </Link>
    </div>
  );
}

/** Friendly first-name greeting. */
function firstName(name?: string): string {
  if (!name) return "there";
  return name.split(" ")[0] ?? name;
}

export default async function HomePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const isInternal = isInternalRole(user.role);
  const [events, unread] = await Promise.all([
    getEvents(),
    getUnreadCount(user.id),
  ]);

  const featured = pickFeaturedEvent(events);
  const others = featured ? events.filter((e) => e.id !== featured.id) : [];

  // Featured-event-specific data only fetched if there's something to feature.
  const [featuredTasks, taskCounts] = await Promise.all([
    featured ? getTasksByEvent(featured.id) : Promise.resolve<Task[]>([]),
    getOpenTaskCountsForUser(
      user.id,
      isInternal,
      events.map((e) => e.id),
    ),
  ]);

  // Internal mode → Library
  if (isInternal) {
    return (
      <EditionShell theme="dark">
        <EditionChrome
          breadcrumbs={[{ label: "Your library" }]}
          rightSlot={
            <>
              <NotificationBell unreadCount={unread} />
              <span
                className="hidden md:block h-6 w-px bg-border"
                aria-hidden
              />
              <UserMenu user={user} />
            </>
          }
        />
        <section className="py-10 md:py-14">
          <EditorialEyebrow>Your work</EditorialEyebrow>
          <h1 className="text-display text-foreground text-[clamp(2.25rem,5vw,4rem)] mt-2">
            Every event, in one place.
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-[52ch]">
            {events.length === 0
              ? "No events in production yet. Create the first one to get started."
              : `${events.length} event${events.length === 1 ? "" : "s"} in production · ${events.filter((e) => e.healthStatus === "green").length} on track.`}
          </p>
        </section>
        <EditionBody>
          {events.length === 0 ? (
            <div className="flex flex-col items-start gap-4 py-8">
              <p className="text-muted-foreground">
                Get started by importing or creating your first event.
              </p>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 rounded-md bg-[var(--color-bb-cobalt)] px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
              >
                Create new edition <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map((event, i) => {
                const health = healthLabel(event);
                return (
                  <div
                    key={event.id}
                    className="stagger-item"
                    style={{ "--stagger-index": i } as React.CSSProperties}
                  >
                    <EditionPlate
                      id={event.id}
                      title={event.name}
                      meta={event.venueName ?? undefined}
                      statusLabel={health.label}
                      statusTone={health.tone}
                      waitingOnYou={(taskCounts[event.id] ?? 0) > 0}
                      href={`/events/${event.id}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </EditionBody>
        <EditionFooter
          rightSlot={
            <Link
              href="/inbox"
              className="hover:opacity-80 transition-opacity"
            >
              Open the queue →
            </Link>
          }
        />
        <CommandPalette isInternal />
      </EditionShell>
    );
  }

  // Customer mode → Featured event editorial spread
  return (
    <EditionShell theme="dark">
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
        <section className="py-16 md:py-24">
          <EditorialEyebrow>Welcome, {firstName(user.name)}</EditorialEyebrow>
          <h1 className="text-display text-foreground text-[clamp(2.25rem,5vw,4rem)] mt-3">
            Your portal is ready.
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-[52ch]">
            No activations in flight yet. Browse our catalog to find what
            fits, or take the quiz and we&apos;ll build the proposal with
            you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-bb-cobalt)] px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110"
            >
              Find a fit <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Browse the catalog
            </Link>
          </div>
        </section>
      ) : (
        <>
          <RidgeHero
            seed={featured.id}
            eyebrow={`Welcome back, ${firstName(user.name)}`}
            title={`${featured.name} is taking shape.`}
            subtitle={(() => {
              const stageLabel =
                STAGE_CONFIG[featured.currentStage as Stage]?.label ??
                featured.currentStage;
              const t = timeUntil(featured);
              if (t === "Live now") return `Live now at ${featured.venueName ?? "your venue"}.`;
              if (t === "Wrapped") return `Wrapped. Reports are landing in your inbox.`;
              return `Currently at ${stageLabel}. Event in ${t}.`;
            })()}
            rightSlot={
              <>
                <span className="flex items-center gap-2">
                  <span
                    className={
                      healthLabel(featured).tone === "active"
                        ? "size-1.5 rounded-full bg-[var(--color-bb-cyan)]"
                        : "size-1.5 rounded-full bg-[hsl(43_90%_56%)]"
                    }
                    aria-hidden
                  />
                  {healthLabel(featured).label}
                </span>
                <span className="text-sm text-foreground tabular-nums">
                  {timeUntil(featured)}
                </span>
              </>
            }
          />

          <EditionBody>
            <ThreeColumn
              left={<WaitingColumn eventId={featured.id} tasks={featuredTasks} />}
              center={
                <div className="space-y-4">
                  <EditorialEyebrow accent>Progress</EditorialEyebrow>
                  {(() => {
                    const rows = getProgressRows(featured);
                    if (rows.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          This event is wrapped. Final reports will be in
                          your inbox shortly.
                        </p>
                      );
                    }
                    return (
                      <ul className="flex flex-col">
                        {rows.map((row) => (
                          <li
                            key={row.id}
                            className="flex items-start justify-between gap-3 border-b border-border/40 py-3 last:border-0"
                          >
                            <span
                              className={
                                row.active
                                  ? "text-sm text-foreground font-medium leading-snug"
                                  : "text-sm text-muted-foreground leading-snug"
                              }
                            >
                              {row.label}
                            </span>
                            <span
                              className={
                                row.active
                                  ? "text-overline text-[var(--color-bb-cobalt)] whitespace-nowrap"
                                  : "text-overline text-muted-foreground whitespace-nowrap"
                              }
                            >
                              {row.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                  <Link
                    href={`/events/${featured.id}/timeline`}
                    className="inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
                  >
                    Open the full timeline →
                  </Link>
                </div>
              }
              right={<TeamColumn eventId={featured.id} />}
            />
          </EditionBody>

          {others.length > 0 && (
            <section className="py-10">
              <div className="flex items-baseline justify-between mb-6">
                <EditorialEyebrow>Your other events</EditorialEyebrow>
                <Link
                  href="/library"
                  className="text-overline text-muted-foreground hover:text-foreground transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {others.slice(0, 6).map((event) => {
                  const health = healthLabel(event);
                  return (
                    <EditionPlate
                      key={event.id}
                      id={event.id}
                      title={event.name}
                      meta={event.venueName ?? undefined}
                      statusLabel={health.label}
                      statusTone={health.tone}
                      waitingOnYou={(taskCounts[event.id] ?? 0) > 0}
                      href={`/events/${event.id}`}
                    />
                  );
                })}
              </div>
              <Hairline className="opacity-60 mt-10" />
            </section>
          )}
        </>
      )}

      <EditionFooter
        rightSlot={
          featured ? (
            <Link
              href={`/events/${featured.id}`}
              className="hover:opacity-80 transition-opacity"
            >
              Open this event →
            </Link>
          ) : null
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}
