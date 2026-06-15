/** Horizontal tab bar for event section navigation. */
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface Tab {
  label: string;
  section: string;
}

const CUSTOMER_TABS: Tab[] = [
  { label: "Overview", section: "" },
  { label: "Briefing", section: "briefing" },
  { label: "Assets", section: "assets" },
  { label: "Approvals", section: "approvals" },
  { label: "Tasks", section: "actions" },
  { label: "Deadlines", section: "deadlines" },
  { label: "Messages", section: "communications" },
  { label: "Live", section: "live" },
  { label: "Leads", section: "leads" },
  { label: "Reports", section: "reports" },
  { label: "Activity", section: "activity" },
];

const INTERNAL_TABS: Tab[] = [
  { label: "Timeline", section: "timeline" },
  { label: "Studio", section: "studio" },
  { label: "Logistics", section: "logistics" },
  { label: "Compliance", section: "compliance" },
  { label: "Configuration", section: "configuration" },
  { label: "QA", section: "qa" },
  { label: "Campaign", section: "campaign" },
];

/**
 * Priority tab sections per internal role. Tabs listed here are
 * promoted to appear immediately after Overview; the rest follow
 * in their default order.
 */
const ROLE_PRIORITY_SECTIONS: Partial<Record<UserRole, string[]>> = {
  creative_lead: ["studio", "assets", "approvals"],
  operations_lead: ["logistics", "qa"],
  qa_lead: ["qa", "logistics"],
};

function reorderInternalTabs(viewerRole?: UserRole): Tab[] {
  const priority = viewerRole ? ROLE_PRIORITY_SECTIONS[viewerRole] : undefined;
  if (!priority) return INTERNAL_TABS;

  const promoted: Tab[] = [];
  const rest: Tab[] = [];
  for (const tab of INTERNAL_TABS) {
    if (priority.includes(tab.section)) {
      promoted.push(tab);
    } else {
      rest.push(tab);
    }
  }
  promoted.sort(
    (a, b) => priority.indexOf(a.section) - priority.indexOf(b.section),
  );
  return [...promoted, ...rest];
}

interface EventTabNavProps {
  eventId: string;
  currentSection: string;
  isInternal: boolean;
  viewerRole?: UserRole;
}

export function EventTabNav({
  eventId,
  currentSection,
  isInternal,
  viewerRole,
}: EventTabNavProps) {
  const tabs = isInternal
    ? [...CUSTOMER_TABS, ...reorderInternalTabs(viewerRole)]
    : CUSTOMER_TABS;

  return (
    <nav
      className="overflow-x-auto -mx-[var(--edition-px,1.5rem)]"
      aria-label="Event sections"
    >
      <div className="flex min-w-max items-center gap-1 px-[var(--edition-px,1.5rem)] py-1">
        {tabs.map((tab) => {
          const href =
            tab.section === ""
              ? `/events/${eventId}`
              : `/events/${eventId}/${tab.section}`;
          const isActive = currentSection === tab.section;

          return (
            <Link
              key={tab.section}
              href={href}
              data-tour={tab.section ? `tab-${tab.section}` : "tab-overview"}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
