/**
 * AdminPageShell — convenience wrapper for internal admin surfaces.
 *
 *   <EditionShell>
 *     <EditionChrome breadcrumbs={...} rightSlot={notifBell+userMenu} />
 *     <RidgeHero eyebrow="Internal" title=... subtitle=... />
 *     <EditionBody>{children}</EditionBody>
 *     <EditionFooter rightSlot="Back to home" />
 *   </EditionShell>
 *
 * Every admin page (asset reviews, quotes, partners, locations,
 * benchmarks, recommendations, campaigns, etc.) should use this so the
 * visual language stays consistent and future re-skinning is one file.
 */

import * as React from "react";
import Link from "next/link";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  type EditionBreadcrumb,
} from "./index";

import type { User } from "@/types";

interface AdminPageShellProps {
  user: User;
  unreadCount: number;
  /** Section name (e.g. "Asset reviews") — also used to seed the ridge. */
  section: string;
  /** Optional crumbs above the section. Defaults to [Home, section]. */
  breadcrumbs?: EditionBreadcrumb[];
  /** Slug override used to seed the ridge artwork. */
  slug?: string;
  /** Eyebrow above the section title. Defaults to "Internal · {section}". */
  eyebrow?: React.ReactNode;
  /** Page title in editorial display type. */
  title: React.ReactNode;
  /** Optional subtitle below the title. */
  subtitle?: React.ReactNode;
  /** Optional right-aligned slot in the hero (counts, filters, etc). */
  heroRight?: React.ReactNode;
  /** Where the "back" link in the footer points. Defaults to "/". */
  backHref?: string;
  /** Footer back-link label. Defaults to "Back to home". */
  backLabel?: string;
  children: React.ReactNode;
}

export function AdminPageShell({
  user,
  unreadCount,
  section,
  breadcrumbs,
  slug,
  eyebrow,
  title,
  subtitle,
  heroRight,
  backHref = "/",
  backLabel = "Back to home",
  children,
}: AdminPageShellProps) {
  const crumbs: EditionBreadcrumb[] =
    breadcrumbs ?? [{ label: "Home", href: "/" }, { label: section }];
  const seedSlug = slug ?? section.toLowerCase().replace(/\s+/g, "-");
  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={crumbs}
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
        seed={`admin::${seedSlug}`}
        eyebrow={eyebrow ?? `Internal · ${section}`}
        title={title}
        subtitle={subtitle}
        rightSlot={heroRight}
      />
      <EditionBody>{children}</EditionBody>
      <EditionFooter
        rightSlot={
          <Link
            href={backHref}
            className="hover:opacity-80 transition-opacity"
          >
            {backLabel} →
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}
