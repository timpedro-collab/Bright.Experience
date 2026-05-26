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
import { ArrowLeft } from "lucide-react";

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

import type { Event, User } from "@/types";

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
  /** Page body. Sits inside <EditionBody> with default hairlines. */
  children: React.ReactNode;
}

export function EventPageShell({
  event,
  user,
  unreadCount,
  section,
  slug,
  eyebrow,
  title,
  subtitle,
  heroRight,
  children,
}: EventPageShellProps) {
  const seedSlug = slug ?? section.toLowerCase().replace(/\s+/g, "-");
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
        seed={`${event.id}::${seedSlug}`}
        eyebrow={eyebrow ?? `${event.account.name} · ${section}`}
        title={title}
        subtitle={subtitle}
        rightSlot={heroRight}
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
      <CommandPalette />
    </EditionShell>
  );
}
