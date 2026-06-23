/** Horizontal tab bar for event section navigation. */
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import {
  SECTION_META,
  visibleSectionsForRole,
  customerNavGroups,
  type EventSection,
} from "@/lib/event-access";
import type { SectionStatus, SectionStatusMap } from "@/lib/queries/event-section-status";
import { isInternalRole } from "@/lib/roles";

interface EventTabNavProps {
  eventId: string;
  currentSection: string;
  /** Viewer's role — the single signal that decides which tabs appear. */
  viewerRole: UserRole;
  /** Per-section completion tone for customers (green/amber/red dots). */
  sectionStatus?: SectionStatusMap;
}

const STATUS_DOT: Record<Exclude<SectionStatus, "neutral">, string> = {
  green: "bg-[hsl(142_60%_45%)]",
  amber: "bg-[hsl(43_90%_55%)]",
  red: "bg-[hsl(0_72%_55%)]",
};

const STATUS_LABEL: Record<Exclude<SectionStatus, "neutral">, string> = {
  green: "complete",
  amber: "in review",
  red: "needs you",
};

export function EventTabNav({
  eventId,
  currentSection,
  viewerRole,
  sectionStatus,
}: EventTabNavProps) {
  const internal = isInternalRole(viewerRole);

  function tabLink(section: EventSection) {
    const { label, route } = SECTION_META[section];
    const href = route === "" ? `/events/${eventId}` : `/events/${eventId}/${route}`;
    const isActive = currentSection === route;
    const status = sectionStatus?.[section];
    const showDot = status && status !== "neutral";
    return (
      <Link
        key={section}
        href={href}
        data-tour={route ? `tab-${route}` : "tab-overview"}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
        {showDot && (
          <>
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                STATUS_DOT[status as Exclude<SectionStatus, "neutral">],
                isActive && "ring-1 ring-primary-foreground/70",
              )}
              aria-hidden
            />
            <span className="sr-only">
              {" "}
              ({STATUS_LABEL[status as Exclude<SectionStatus, "neutral">]})
            </span>
          </>
        )}
      </Link>
    );
  }

  // Internal roles keep the flat, dense tab row — they're power users.
  if (internal) {
    const sections = visibleSectionsForRole(viewerRole);
    return (
      <nav
        className="overflow-x-auto -mx-[var(--edition-px,1.5rem)]"
        aria-label="Event sections"
      >
        <div className="flex min-w-max items-center gap-1 px-[var(--edition-px,1.5rem)] py-1">
          {sections.map((section) => tabLink(section))}
        </div>
      </nav>
    );
  }

  // Customers get a calmer, phase-grouped row: a standalone Overview anchor,
  // then the four lifecycle phases clustered behind quiet phase labels.
  const { anchor, phases } = customerNavGroups(viewerRole);
  return (
    <nav
      className="overflow-x-auto -mx-[var(--edition-px,1.5rem)]"
      aria-label="Event sections"
    >
      <div className="flex min-w-max items-center gap-2 px-[var(--edition-px,1.5rem)] py-1">
        {anchor && tabLink(anchor)}
        {phases.map((phase) => (
          <div key={phase.id} className="flex items-center gap-1">
            <span
              className="ml-2 shrink-0 border-l border-border/60 pl-3 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70"
              aria-hidden
            >
              {phase.label}
            </span>
            {phase.sections.map((section) => tabLink(section))}
          </div>
        ))}
      </div>
    </nav>
  );
}
