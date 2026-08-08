/**
 * Single source of truth for which event sections each role may see.
 *
 * This drives BOTH the event tab navigation AND the per-page server
 * guards — so a section a role can't see is genuinely unreachable, not
 * just hidden from the menu.
 *
 * The principle: a section appears for a role only if that role acts on
 * it or needs it to do their job. Events Lead, Admin, and Developer see
 * everything (orchestration / full-stack). Creative, Ops, and QA get a
 * focused view of just their lane. Customers see their own journey.
 *
 * Pure module — no server-only imports — so it's safe to use from the
 * client nav component as well as server components.
 */
import type { UserRole } from "@/types";

export type EventSection =
  | "overview"
  | "briefing"
  | "assets"
  | "approvals"
  | "actions"
  | "deadlines"
  | "communications"
  | "live"
  | "leads"
  | "reports"
  | "timeline"
  | "studio"
  | "logistics"
  | "compliance"
  | "configuration"
  | "machine"
  | "qa"
  | "campaign"
  | "activity";

/** Tab label + URL route segment for each section, in display order. */
export const SECTION_META: Record<
  EventSection,
  { label: string; route: string }
> = {
  overview: { label: "Overview", route: "" },
  briefing: { label: "Briefing", route: "briefing" },
  assets: { label: "Assets", route: "assets" },
  approvals: { label: "Approvals", route: "approvals" },
  actions: { label: "Tasks", route: "actions" },
  deadlines: { label: "Deadlines", route: "deadlines" },
  communications: { label: "Messages", route: "communications" },
  live: { label: "Live", route: "live" },
  leads: { label: "Leads", route: "leads" },
  reports: { label: "Reports", route: "reports" },
  timeline: { label: "Timeline", route: "timeline" },
  studio: { label: "Studio", route: "studio" },
  logistics: { label: "Logistics", route: "logistics" },
  compliance: { label: "Compliance", route: "compliance" },
  configuration: { label: "Configuration", route: "configuration" },
  machine: { label: "Machine", route: "machine" },
  qa: { label: "QA", route: "qa" },
  campaign: { label: "Campaign", route: "campaign" },
  activity: { label: "Activity", route: "activity" },
};

/** Canonical section order — used to render tabs consistently. */
export const ALL_SECTIONS: EventSection[] = Object.keys(
  SECTION_META,
) as EventSection[];

/** Roles that see every section (orchestration / full-stack). */
const FULL_ACCESS_ROLES: UserRole[] = ["events_lead", "admin"];

const CUSTOMER_ROLES: UserRole[] = ["customer_user", "customer_admin"];

/**
 * What the customer sees on their own event — their journey, the work on
 * their plate, results, and a customer-safe timeline (the Timeline page
 * strips ops controls/history for them).
 *
 * `configuration` and `logistics` are included because the customer owns
 * tasks that live there ("Confirm prize details and quantities" →
 * configuration, "Provide onsite contact details" → logistics). Both pages
 * render a customer-safe surface: configuration shows the customer-editable
 * prize/setup form, logistics shows a read-only delivery summary plus the
 * onsite-contact capture. Without access, those task CTAs would deep-link to
 * a page the customer is bounced out of.
 */
const CUSTOMER_SECTIONS: EventSection[] = [
  "overview",
  "briefing",
  "assets",
  "approvals",
  "actions",
  // `deadlines` is intentionally omitted for customers — their schedule is
  // folded into the Tasks page (a "by due date" view) so they have one place
  // for "what's on my plate", not two competing lists. Internal roles keep the
  // dedicated Deadlines page (see ROLE_SECTIONS / FULL_ACCESS_ROLES).
  "communications",
  "live",
  "leads",
  "reports",
  "timeline",
  "configuration",
  "logistics",
];

/**
 * Sections only the client's lead contact (`customer_admin`) sees on top of
 * the shared customer set. Self-ordering Bright.Studio creative services is a
 * commercial commitment, so it's reserved for the lead contact — junior
 * invited users (`customer_user`) don't get the Studio tab. The order action
 * is independently gated by the `studio.order` permission.
 */
const CUSTOMER_ADMIN_EXTRA_SECTIONS: EventSection[] = ["studio"];

/** Focused section sets for the specialist internal roles. */
const ROLE_SECTIONS: Partial<Record<UserRole, EventSection[]>> = {
  // Creative Lead: brief → assets → proofs → studio, plus game/prize config.
  creative_lead: [
    "overview",
    "briefing",
    "assets",
    "approvals",
    "actions",
    "deadlines",
    "communications",
    "studio",
    "configuration",
  ],
  // Operations Lead: the physical-delivery lane only — what the customer
  // inputted (product mix / prize config), the delivery details (dates,
  // slots, location, onsite contact), the machine build, compliance, and
  // QA readiness. Tasks are included because ops own work items whose
  // deep-links land on /events/[id]/actions. NO creative surfaces
  // (briefing/assets/approvals): ops doesn't act on creative, so it isn't
  // shown.
  operations_lead: [
    "overview",
    "actions",
    "logistics",
    "configuration",
    "machine",
    "compliance",
    "qa",
  ],
  // QA Lead: the build, the checks, readiness, and live verification. They
  // verify the machine build (read-only) alongside the game/product config.
  qa_lead: [
    "overview",
    "actions",
    "deadlines",
    "live",
    "timeline",
    "configuration",
    "machine",
    "qa",
  ],
};

/** Sections a role may see, in canonical display order. */
export function visibleSectionsForRole(role: UserRole): EventSection[] {
  if (FULL_ACCESS_ROLES.includes(role)) return [...ALL_SECTIONS];
  if (CUSTOMER_ROLES.includes(role)) {
    const allowed =
      role === "customer_admin"
        ? [...CUSTOMER_SECTIONS, ...CUSTOMER_ADMIN_EXTRA_SECTIONS]
        : CUSTOMER_SECTIONS;
    return ALL_SECTIONS.filter((s) => allowed.includes(s));
  }
  const scoped = ROLE_SECTIONS[role];
  if (scoped) return ALL_SECTIONS.filter((s) => scoped.includes(s));
  // Unknown role — fail closed to the hub only.
  return ["overview"];
}

/** Whether a role may view a given section. */
export function canViewSection(role: UserRole, section: EventSection): boolean {
  return visibleSectionsForRole(role).includes(section);
}

/**
 * Customer lifecycle phases.
 *
 * Customers see ~11 sections — a flat row of 11 tabs is overwhelming and reads
 * like an internal console. We group them into the four phases of an event's
 * life so the customer always knows *where in the journey* a tab lives, while
 * keeping one-click access to each section. Overview stays as a standalone
 * anchor (the dashboard) and isn't part of a phase.
 */
export interface CustomerPhase {
  id: string;
  label: string;
  sections: EventSection[];
}

export const CUSTOMER_PHASES: CustomerPhase[] = [
  { id: "create", label: "Create", sections: ["briefing", "assets", "configuration", "approvals", "studio"] },
  { id: "prepare", label: "Prepare", sections: ["actions", "timeline"] },
  { id: "event-day", label: "Event day", sections: ["logistics", "communications", "live"] },
  { id: "results", label: "Results", sections: ["leads", "reports"] },
];

/**
 * Group a customer's visible sections into ordered phases (skipping any
 * section they can't see). Overview is returned separately as the anchor tab.
 */
export function customerNavGroups(role: UserRole): {
  anchor: EventSection | null;
  phases: CustomerPhase[];
} {
  const visible = new Set(visibleSectionsForRole(role));
  const anchor = visible.has("overview") ? "overview" : null;
  const phases = CUSTOMER_PHASES.map((p) => ({
    ...p,
    sections: p.sections.filter((s) => visible.has(s)),
  })).filter((p) => p.sections.length > 0);
  return { anchor, phases };
}

/**
 * Internal power-user nav clustering.
 *
 * The full-access roles see up to 19 sections; a flat pill row scrolls off
 * the edge of the screen and hides half the console. We cluster the sections
 * into four labelled groups so an internal user can scan by concern —
 * Deliver (creative pipeline), Ops (physical build), Data (live + results),
 * and Manage (coordination) — and the bar wraps instead of scrolling.
 */
export interface InternalNavCluster {
  label: string;
  sections: EventSection[];
}

const INTERNAL_NAV_CLUSTERS: InternalNavCluster[] = [
  { label: "Deliver", sections: ["briefing", "assets", "approvals", "studio", "configuration"] },
  { label: "Ops", sections: ["logistics", "machine", "compliance", "qa"] },
  { label: "Data", sections: ["live", "leads", "reports", "campaign"] },
  { label: "Manage", sections: ["actions", "deadlines", "communications", "timeline", "activity"] },
];

/**
 * Group an internal role's visible sections into the labelled clusters above,
 * in canonical order. Overview is returned separately as the anchor tab; any
 * visible section not named in a cluster is appended to a trailing "More"
 * group so nothing silently disappears from the nav.
 */
export function internalNavGroups(role: UserRole): {
  anchor: EventSection | null;
  clusters: InternalNavCluster[];
} {
  const visible = visibleSectionsForRole(role);
  const visibleSet = new Set(visible);
  const anchor = visibleSet.has("overview") ? "overview" : null;

  const clustered = new Set<EventSection>(["overview"]);
  const clusters: InternalNavCluster[] = [];
  for (const cluster of INTERNAL_NAV_CLUSTERS) {
    const sections = cluster.sections.filter((s) => visibleSet.has(s));
    sections.forEach((s) => clustered.add(s));
    if (sections.length > 0) clusters.push({ label: cluster.label, sections });
  }

  const leftovers = visible.filter((s) => !clustered.has(s));
  if (leftovers.length > 0) clusters.push({ label: "More", sections: leftovers });

  return { anchor, clusters };
}
