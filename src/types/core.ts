/** Foundational domain types: stages, accounts, users, events, milestones. */

export type Stage =
  | "confirmed"
  | "kickoff_complete"
  | "creative_assets"
  | "approvals"
  | "build_configuration"
  | "qa_readiness"
  | "logistics_confirmed"
  | "event_live"
  | "reporting"
  | "complete";

export type HealthStatus = "green" | "amber" | "red";

export type EventType =
  | "activation"
  | "sampling"
  | "vending"
  | "hybrid"
  | "custom";

export type PackageType = "standard" | "premium" | "custom";

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "skipped";

export type UserRole =
  | "customer_user"
  | "customer_admin"
  | "events_lead"
  | "creative_lead"
  | "operations_lead"
  | "qa_lead"
  | "admin"
  | "partner_member"
  | "partner_admin";

export interface Account {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  accountId?: string;
  hasCompletedOnboarding: boolean;
}

export interface Event {
  id: string;
  accountId: string;
  account: Account;
  name: string;
  eventType: EventType;
  packageType: PackageType;
  machineType?: string;
  venueName?: string;
  venueAddress?: string;
  eventDateStart: string;
  eventDateEnd?: string;
  setupDate?: string;
  collectionDate?: string;
  currentStage: Stage;
  healthStatus: HealthStatus;
  /** True when an internal user flagged this event by hand. */
  healthOverride?: boolean;
  /** Why it was flagged — internal-only, never shown to the customer. */
  healthReason?: string;
  templateId?: string;
  /**
   * Set when this event is a show run by an organizer partner. Grants that
   * partner's users read access to the show and control of its sponsor slots.
   */
  organizerPartnerId?: string;
  /** Pipedrive deal ID this event is linked to, if any. */
  pipedriveDealId?: string;
  /** When the Pipedrive link was first established. */
  pipedriveLinkedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  eventId: string;
  name: string;
  stage: Stage;
  status: MilestoneStatus;
  targetDate?: string;
  completedAt?: string;
  sortOrder: number;
  customerVisible: boolean;
}

/** Team member request status */
export type TeamMemberStatus = "pending" | "approved" | "removed";

/** A team member linked (or requested) for a specific event */
export interface EventTeamMember {
  id: string;
  eventId: string;
  profileId?: string;
  email: string;
  roleLabel: string;
  status: TeamMemberStatus;
  requestedBy?: string;
  approvedBy?: string;
  /** Joined profile data, if resolved. */
  profile?: { name: string; avatarUrl?: string };
  createdAt: string;
  updatedAt: string;
}

export const STAGE_CONFIG: Record<
  Stage,
  { label: string; shortLabel: string; order: number }
> = {
  confirmed: { label: "Event Confirmed", shortLabel: "Confirmed", order: 0 },
  kickoff_complete: {
    label: "Kickoff Complete",
    shortLabel: "Kickoff",
    order: 1,
  },
  creative_assets: {
    label: "Creative & Assets",
    shortLabel: "Creative",
    order: 2,
  },
  approvals: { label: "Approvals", shortLabel: "Approvals", order: 3 },
  build_configuration: {
    label: "Build & Configuration",
    shortLabel: "Build",
    order: 4,
  },
  qa_readiness: { label: "QA & Readiness", shortLabel: "QA", order: 5 },
  logistics_confirmed: {
    label: "Logistics Confirmed",
    shortLabel: "Logistics",
    order: 6,
  },
  event_live: { label: "Event Live", shortLabel: "Live", order: 7 },
  reporting: { label: "Reporting", shortLabel: "Reporting", order: 8 },
  complete: { label: "Complete", shortLabel: "Complete", order: 9 },
};

export const HEALTH_CONFIG: Record<HealthStatus, { label: string }> = {
  green: { label: "On Track" },
  amber: { label: "At Risk" },
  red: { label: "Blocked" },
};
