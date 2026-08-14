/** Event section navigation — a stage-aware phase bar for customers, clustered pills for internal. */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stage, UserRole } from "@/types";
import {
  SECTION_META,
  customerNavGroups,
  internalNavGroups,
  CUSTOMER_PHASES,
  type EventSection,
} from "@/lib/event-access";
import { isStageAtOrAfter, phaseForStage } from "@/lib/journey";
import type { SectionStatus, SectionStatusMap } from "@/lib/queries/event-section-status";
import { isInternalRole } from "@/lib/roles";

interface EventTabNavProps {
  eventId: string;
  currentSection: string;
  /** Viewer's role — the single signal that decides which tabs appear. */
  viewerRole: UserRole;
  /** The event's current lifecycle stage — drives customer phase-awareness. */
  currentStage: Stage;
  /** Per-section completion tone for customers (green/amber/red dots). */
  sectionStatus?: SectionStatusMap;
  /** Unread message-thread notifications — numeric badge on the Messages tab. */
  unreadMessages?: number;
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
  currentStage,
  sectionStatus,
  unreadMessages = 0,
}: EventTabNavProps) {
  const internal = isInternalRole(viewerRole);

  function tabLink(section: EventSection, opts?: { upcoming?: boolean }) {
    const { label, route } = SECTION_META[section];
    const href = route === "" ? `/events/${eventId}` : `/events/${eventId}/${route}`;
    const isActive = currentSection === route;
    const status = sectionStatus?.[section];
    const showDot = status && status !== "neutral";
    const unread = section === "communications" ? unreadMessages : 0;
    return (
      <Link
        key={section}
        href={href}
        data-tour={route ? `tab-${route}` : "tab-overview"}
        title={opts?.upcoming ? "Opens as your event progresses" : undefined}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : opts?.upcoming
              ? "text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
        {unread > 0 && (
          <span
            className={cn(
              "inline-flex min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[0.625rem] font-semibold tabular-nums leading-4",
              isActive
                ? "bg-primary-foreground/90 text-primary"
                : "bg-[var(--color-bb-cobalt)] text-white",
            )}
            aria-label={`${unread} unread message${unread === 1 ? "" : "s"}`}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
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

  /** Stock shares the logistics visibility gate — ops lane + customer event day. */
  function stockTabLink(opts?: { upcoming?: boolean }) {
    const href = `/events/${eventId}/stock`;
    const isActive = currentSection === "stock";
    return (
      <Link
        key="stock"
        href={href}
        data-tour="tab-stock"
        title={opts?.upcoming ? "Opens as your event progresses" : undefined}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : opts?.upcoming
              ? "text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        Stock
      </Link>
    );
  }

  // Stock is on-the-day consumable tracking: a pre-brief customer has no job
  // there, so the tab only appears once logistics are locked. Internal roles
  // keep it always (ops preps stock ahead of the confirmation).
  const showStockTab =
    internal || isStageAtOrAfter(currentStage, "logistics_confirmed");

  function sectionTabs(sections: EventSection[], opts?: { upcoming?: boolean }) {
    return sections.flatMap((section) => {
      const links = [tabLink(section, opts)];
      if (section === "logistics" && showStockTab)
        links.push(stockTabLink(opts));
      return links;
    });
  }

  // Internal roles keep the dense tab set, but clustered into labelled groups
  // that WRAP rather than scroll — the whole console is always visible.
  if (internal) {
    const { anchor, clusters } = internalNavGroups(viewerRole);
    return (
      <nav
        className="-mx-[var(--edition-px,1.5rem)] px-[var(--edition-px,1.5rem)] py-1"
        aria-label="Event sections"
      >
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {anchor && tabLink(anchor)}
          {clusters.map((cluster) => (
            <div key={cluster.label} className="flex items-center gap-1">
              <span
                className="ml-2 shrink-0 border-l border-border/60 pl-3 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70"
                aria-hidden
              >
                {cluster.label}
              </span>
              {sectionTabs(cluster.sections)}
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <CustomerPhaseNav
      currentSection={currentSection}
      currentStage={currentStage}
      viewerRole={viewerRole}
      tabLink={tabLink}
      sectionTabs={sectionTabs}
    />
  );
}

/**
 * The customer nav: four phase chips that always fit (no horizontal scroll),
 * with the current stage's phase expanded to its section tabs by default.
 * Tapping any phase expands it; phases beyond the current stage read as quiet
 * "upcoming" so customers can see what's ahead without being overwhelmed.
 */
function CustomerPhaseNav({
  currentSection,
  currentStage,
  viewerRole,
  tabLink,
  sectionTabs,
}: {
  currentSection: string;
  currentStage: Stage;
  viewerRole: UserRole;
  tabLink: (section: EventSection, opts?: { upcoming?: boolean }) => React.ReactNode;
  sectionTabs: (
    sections: EventSection[],
    opts?: { upcoming?: boolean },
  ) => React.ReactNode[];
}) {
  const { anchor, phases } = customerNavGroups(viewerRole);
  const currentPhaseIndex = phaseForStage(currentStage).index;

  const phaseLifecycleIndex = (phaseId: string) =>
    CUSTOMER_PHASES.findIndex((p) => p.id === phaseId);

  // Which phase owns the active section? Default the open phase to that, else
  // to the phase the event is currently in.
  const activePhase = phases.find(
    (p) =>
      p.sections.some((s) => SECTION_META[s].route === currentSection) ||
      (currentSection === "stock" && p.sections.includes("logistics")),
  );
  const currentPhase = phases.find(
    (p) => phaseLifecycleIndex(p.id) === currentPhaseIndex,
  );
  const defaultOpen = activePhase?.id ?? currentPhase?.id ?? phases[0]?.id ?? "";
  const [open, setOpen] = useState<string>(defaultOpen);

  const openPhase = phases.find((p) => p.id === open) ?? phases[0];
  const openLifecycleIndex = openPhase ? phaseLifecycleIndex(openPhase.id) : 0;
  const openIsUpcoming = openLifecycleIndex > currentPhaseIndex;

  return (
    <nav
      className="-mx-[var(--edition-px,1.5rem)] px-[var(--edition-px,1.5rem)] py-1"
      aria-label="Event sections"
    >
      <div className="flex flex-wrap items-center gap-2">
        {anchor && tabLink(anchor)}
        <span className="mx-1 hidden h-5 w-px bg-border/60 sm:block" aria-hidden />
        {phases.map((phase) => {
          const lifecycleIndex = phaseLifecycleIndex(phase.id);
          const state =
            lifecycleIndex < currentPhaseIndex
              ? "done"
              : lifecycleIndex === currentPhaseIndex
                ? "current"
                : "upcoming";
          const isOpen = phase.id === openPhase?.id;
          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => setOpen(phase.id)}
              aria-expanded={isOpen}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isOpen
                  ? "border-transparent bg-muted text-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                state === "current" && !isOpen && "border-[var(--color-bb-cobalt)]/40",
              )}
            >
              {state === "done" && (
                <Check size={12} className="text-success" aria-hidden />
              )}
              {state === "current" && (
                <span
                  className="size-1.5 rounded-full bg-[var(--color-bb-cobalt)]"
                  aria-hidden
                />
              )}
              {phase.label}
              <span className="text-[0.65rem] text-muted-foreground/70 tabular-nums">
                {phase.sections.length}
              </span>
            </button>
          );
        })}
      </div>

      {openPhase && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2">
          {openIsUpcoming && (
            <span className="mr-1 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
              Coming up
            </span>
          )}
          {sectionTabs(openPhase.sections, { upcoming: openIsUpcoming })}
        </div>
      )}
    </nav>
  );
}
