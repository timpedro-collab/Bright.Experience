/**
 * EventPageShell — convenience wrapper that composes the standard
 * Bright.Experience event sub-page chrome.
 *
 *   <EditionShell>
 *     <EditionChrome breadcrumbs=[Home / {event} / {section}] />
 *     <RidgeHero seed="{eventId}::{slug}" eyebrow={...} title={...} />
 *     <EditionBody>{children}</EditionBody>
 *     <EditionFooter rightSlot="Back to {event}" />
 *   </EditionShell>
 *
 * Every event sub-page (timeline, briefing, assets, approvals, actions,
 * logistics, QA, etc.) should use this — keeps the visual language
 * consistent and makes future re-skinning a one-file change.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
} from "./index";
import { EventTabNav } from "./EventTabNav";
import {
  getEventSectionStatus,
  type SectionStatusMap,
} from "@/lib/queries/event-section-status";

import type { Event, User, UserRole } from "@/types";

const CUSTOMER_ROLES: UserRole[] = ["customer_admin", "customer_user"];

interface EventPageShellProps {
  event: Event;
  user: User;
  unreadCount: number;
  /** Display label for this section (e.g. "Timeline", "Briefing"). */
  section: string;
  /** Slug used to seed the ridge artwork (defaults to `section` lowercased). */
  slug?: string;
  /** Eyebrow above the page title — falls back to account · section. */
  eyebrow?: React.ReactNode;
  /** Page title, large editorial display type. */
  title: React.ReactNode;
  /** Optional subtitle below the title. */
  subtitle?: React.ReactNode;
  /** Optional content for the hero's right slot. */
  heroRight?: React.ReactNode;
  /** Whether the viewer is an internal Bright.Blue user (shows extra tabs). */
  isInternal?: boolean;
  /** Viewer's role — used to reorder internal tabs by relevance. */
  viewerRole?: UserRole;
  /** Page body. Sits inside <EditionBody> with default hairlines. */
  children: React.ReactNode;
}

/** Map the display section label to the URL slug for active-tab matching. */
const SECTION_TO_SLUG: Record<string, string> = {
  Overview: "",
  Timeline: "timeline",
  Actions: "actions",
  Messages: "communications",
  Briefing: "briefing",
  Assets: "assets",
  Approvals: "approvals",
  "Bright.Studio": "studio",
  "Quality assurance": "qa",
  Logistics: "logistics",
  Live: "live",
  Leads: "leads",
  Reports: "reports",
  Campaign: "campaign",
};

export async function EventPageShell({
  event,
  user,
  unreadCount,
  section,
  slug,
  eyebrow,
  title,
  subtitle,
  heroRight,
  isInternal = false,
  viewerRole,
  children,
}: EventPageShellProps) {
  const seedSlug = slug ?? section.toLowerCase().replace(/\s+/g, "-");
  const currentSection = SECTION_TO_SLUG[section] ?? seedSlug;

  // Customers get green/amber/red completion dots on their tabs so it's clear
  // where the ball sits. Internal roles keep the dense, dotless power-user nav.
  const effectiveRole = viewerRole ?? user.role;
  let sectionStatus: SectionStatusMap | undefined;
  if (CUSTOMER_ROLES.includes(effectiveRole)) {
    sectionStatus = await getEventSectionStatus(event.id);
  }
  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: event.name, href: `/events/${event.id}` },
          { label: section },
        ]}
        rightSlot={
          <>
            <Link
              href="/help"
              className="inline-flex items-center justify-center size-9 rounded-[var(--radius-control)] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Help center"
            >
              <HelpCircle size={18} />
            </Link>
            <NotificationBell unreadCount={unreadCount} />
            <span
              className="hidden md:block h-6 w-px bg-border"
              aria-hidden
            />
            <UserMenu user={user} />
          </>
        }
      />
      <RidgeHero
        variant="compact"
        seed={`${event.id}::${seedSlug}`}
        eyebrow={eyebrow ?? `${event.account.name} · ${section}`}
        title={title}
        subtitle={subtitle}
        rightSlot={heroRight}
      />
      <EventTabNav
        eventId={event.id}
        currentSection={currentSection}
        viewerRole={effectiveRole}
        sectionStatus={sectionStatus}
      />
      <EditionBody>{children}</EditionBody>
      <EditionFooter
        rightSlot={
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-3 w-3" /> Back to {event.name}
          </Link>
        }
      />
      <CommandPalette eventId={event.id} isInternal={isInternal} role={user.role} />
    </EditionShell>
  );
}
