/**
 * FocusedHome — the premium, action-first internal landing.
 *
 * One calm rhythm for every internal role:
 *   1. Hero — greeting + a single focus sentence ("3 things need you today").
 *   2. "What needs you now" — the prioritized, role-sourced action list.
 *   3. A slim portfolio rail (orchestrator + specialist roles) for context.
 *
 * The dense charts, filters, and full event library now live on /pipeline —
 * this surface stays glanceable. Pure presentation: all data is fetched by
 * the home page server component and passed in as serializable props.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GlassCard, GlassCardHeader } from "@/components/cloud";
import {
  EditionShell,
  EditionChrome,
  EditionFooter,
  RidgeHero,
} from "@/components/brand";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { StreakIndicator } from "@/components/dashboard/StreakIndicator";
import { TourShell } from "@/components/onboarding/TourShell";
import { NeedsYouNow } from "@/components/home/NeedsYouNow";
import { PortfolioStrip } from "@/components/home/PortfolioStrip";
import { firstName } from "@/components/home/home-helpers";

import { labelForRole } from "@/lib/roles";
import type { FocusItem } from "@/lib/queries/home-focus";
import type { Event, User } from "@/types";

interface FocusedHomeProps {
  user: User;
  unread: number;
  streak: number;
  focusItems: FocusItem[];
  stripEvents: Event[];
  taskCounts: Record<string, number>;
  taskProgress: Record<string, { completed: number; total: number }>;
  stripTitle: string;
  stripSubtitle?: string;
  showStrip: boolean;
}

export function FocusedHome({
  user,
  unread,
  streak,
  focusItems,
  stripEvents,
  taskCounts,
  taskProgress,
  stripTitle,
  stripSubtitle,
  showStrip,
}: FocusedHomeProps) {
  const count = focusItems.length;
  const focusSentence =
    count === 0
      ? "You're all caught up — nothing is waiting on you right now."
      : `${count} thing${count === 1 ? "" : "s"} need${count === 1 ? "s" : ""} your attention today.`;

  return (
    <TourShell role={user.role} autoStart={false}>
      <EditionShell>
        <EditionChrome
          breadcrumbs={[{ label: "Command centre" }]}
          rightSlot={
            <>
              <NotificationBell unreadCount={unread} />
              <span className="hidden md:block h-6 w-px bg-border" aria-hidden />
              <UserMenu user={user} />
            </>
          }
        />

        <RidgeHero
          variant="compact"
          seed={user.id}
          eyebrow={`${labelForRole(user.role)} · Command centre`}
          title={`Welcome back, ${firstName(user.name)}.`}
          subtitle={focusSentence}
          rightSlot={<StreakIndicator streak={streak} />}
        />

        <div className="space-y-8 py-6">
          <GlassCard data-tour="my-work">
            <GlassCardHeader
              title="What needs you now"
              description="Your top priorities across every event, most urgent first — your full task list lives in your Inbox"
              action={
                <Link
                  href="/pipeline"
                  data-tour="pipeline-link"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
                >
                  Open pipeline <ArrowRight className="size-4" />
                </Link>
              }
            />
            <NeedsYouNow items={focusItems} />
          </GlassCard>

          {showStrip && (
            <PortfolioStrip
              title={stripTitle}
              subtitle={stripSubtitle}
              events={stripEvents}
              taskCounts={taskCounts}
              taskProgress={taskProgress}
            />
          )}
        </div>

        <EditionFooter
          rightSlot={
            <Link href="/inbox" className="hover:opacity-80 transition-opacity">
              Open your inbox →
            </Link>
          }
        />
        <CommandPalette isInternal role={user.role} />
      </EditionShell>
    </TourShell>
  );
}
