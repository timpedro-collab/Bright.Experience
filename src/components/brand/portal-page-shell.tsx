/**
 * PortalPageShell — Cloud chrome for the partner & venue portals.
 *
 *   <EditionShell>
 *     <EditionChrome breadcrumbs={[Home / {scope} / {section}]} />
 *     <RidgeHero eyebrow="{scope}" title=... subtitle=... />
 *     <PortalTabNav tabs={...} />          ← replaces the legacy sidebar nav
 *     <EditionBody>{children}</EditionBody>
 *     <EditionFooter rightSlot="Back to dashboard" />
 *   </EditionShell>
 *
 * Mirrors EventPageShell / AdminPageShell so partner and venue surfaces
 * share the exact same visual language as the rest of the platform.
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
  type EditionBreadcrumb,
} from "./index";
import { PortalTabNav, type PortalTab } from "./PortalTabNav";
import { isPartnerAdmin } from "@/lib/roles";

import type { User, UserRole } from "@/types";

interface PortalPageShellProps {
  user: User;
  unreadCount: number;
  /** Eyebrow scope label — e.g. the partner or venue name. */
  scope: string;
  /** Section name (e.g. "Dashboard") — seeds the ridge + breadcrumb. */
  section: string;
  /** Slug used to seed the ridge artwork. */
  slug: string;
  /** Tab definitions for this portal (label + absolute href). */
  tabs: PortalTab[];
  /** Page title in compact display type. */
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  heroRight?: React.ReactNode;
  /** Where the footer "back" link points. Defaults to the first tab. */
  backHref?: string;
  backLabel?: string;
  /** Optional breadcrumb override. */
  breadcrumbs?: EditionBreadcrumb[];
  /** Override the user-menu role label (venue portal passes "Venue admin"). */
  roleLabel?: string;
  children: React.ReactNode;
}

export function PortalPageShell({
  user,
  unreadCount,
  scope,
  section,
  slug,
  tabs,
  title,
  subtitle,
  heroRight,
  backHref,
  backLabel = "Back to dashboard",
  breadcrumbs,
  roleLabel,
  children,
}: PortalPageShellProps) {
  const crumbs: EditionBreadcrumb[] =
    breadcrumbs ??
    [
      { label: "Home", href: "/" },
      { label: scope, href: tabs[0]?.href },
      { label: section },
    ];

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={crumbs}
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
            <span className="hidden md:block h-6 w-px bg-border" aria-hidden />
            <UserMenu user={user} roleLabel={roleLabel} />
          </>
        }
      />
      <RidgeHero
        variant="compact"
        seed={`portal::${slug}::${section}`}
        eyebrow={scope}
        title={title}
        subtitle={subtitle}
        rightSlot={heroRight}
      />
      <PortalTabNav tabs={tabs} />
      <EditionBody>{children}</EditionBody>
      <EditionFooter
        rightSlot={
          <Link
            href={backHref ?? tabs[0]?.href ?? "/"}
            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-3 w-3" /> {backLabel}
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}

/**
 * Partner portal tab set for a given slug. Commission management is the
 * partner org lead's surface — `partner_member` sellers don't see it, so
 * the tab only renders for `partner_admin` (see `isPartnerAdmin`).
 */
export function partnerTabs(slug: string, viewerRole: UserRole): PortalTab[] {
  const tabs: PortalTab[] = [
    { label: "Dashboard", href: `/partners/${slug}/dashboard` },
    { label: "Clients", href: `/partners/${slug}/clients` },
    { label: "Quotes", href: `/partners/${slug}/quotes` },
  ];
  if (isPartnerAdmin(viewerRole)) {
    tabs.push({ label: "Commissions", href: `/partners/${slug}/commissions` });
  }
  tabs.push({ label: "Resources", href: `/partners/${slug}/resources` });
  return tabs;
}

/**
 * User-menu role label for a venue operator. Venues are modelled as
 * `partner_*` roles, so this maps them to venue-facing language.
 */
export function venueRoleLabel(role: UserRole): string {
  return isPartnerAdmin(role) ? "Venue admin" : "Venue";
}

/** Venue portal tab set for a given slug. */
export function venueTabs(slug: string): PortalTab[] {
  return [
    { label: "Dashboard", href: `/venues/${slug}/dashboard` },
    { label: "Placements", href: `/venues/${slug}/placements` },
    { label: "Sponsorships", href: `/venues/${slug}/sponsorships` },
    { label: "Calendar", href: `/venues/${slug}/calendar` },
    { label: "Earnings", href: `/venues/${slug}/earnings` },
    { label: "Packages", href: `/venues/${slug}/packages` },
    { label: "Embed", href: `/venues/${slug}/embed` },
  ];
}

/**
 * User-menu role label for a show organizer. Organizers are modelled as
 * `partner_*` roles, so this maps them to show-facing language.
 */
export function organizerRoleLabel(role: UserRole): string {
  return isPartnerAdmin(role) ? "Show organizer" : "Show team";
}

/** Organizer portal tab set for a given slug. */
export function organizerTabs(slug: string): PortalTab[] {
  return [
    { label: "Shows", href: `/organizers/${slug}/shows` },
    { label: "Fleet", href: `/organizers/${slug}/fleet` },
    { label: "Sponsors", href: `/organizers/${slug}/sponsors` },
    { label: "Deals", href: `/organizers/${slug}/deals` },
    { label: "Earnings", href: `/organizers/${slug}/earnings` },
  ];
}
