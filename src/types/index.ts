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

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "complete"
  | "blocked"
  | "skipped";

export type TaskType = "customer_action" | "internal_action";

export type TaskCategory =
  | "creative"
  | "operations"
  | "qa"
  | "development"
  | "logistics"
  | "reporting"
  | "admin";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type AssetStatus =
  | "required"
  | "uploaded"
  | "under_review"
  | "accepted"
  | "rejected";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revision_requested";

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
  | "developer"
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
  templateId?: string;
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

export interface Task {
  id: string;
  eventId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  taskType: TaskType;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: User;
  dueDate?: string;
  completedAt?: string;
  isBlocking: boolean;
  customerVisible: boolean;
  sortOrder: number;
}

/**
 * Bright.Blue creative review state — orthogonal to the customer-facing
 * `status` enum. `pending_review` is the default after upload, `approved`
 * clears any milestone gates, and `revision_requested` always carries a
 * feedback string the customer reads inline.
 */
export type AssetReviewStatus =
  | "pending_review"
  | "approved"
  | "revision_requested";

export interface Asset {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  assetType: string;
  requiredFormat?: string;
  requiredDimensions?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  version: number;
  status: AssetStatus;
  reviewFeedback?: string;
  dueDate?: string;
  customerVisible: boolean;
  /** Creative-team review state (PR 2: asset review gate). */
  reviewStatus: AssetReviewStatus;
  reviewDecidedBy?: string;
  reviewDecidedAt?: string;
  revisionCount: number;
  uploadedBy?: string;
}

export interface Approval {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  approvalType: string;
  status: ApprovalStatus;
  previewUrl?: string;
  requestedBy?: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  feedback?: string;
  revisionCount: number;
  customerVisible: boolean;
}

export type StudioRequestStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "quoted"
  | "approved"
  | "in_progress"
  | "delivered"
  | "cancelled";

export type StudioServiceType =
  | "design"
  | "animation"
  | "video"
  | "photography"
  | "copywriting"
  | "other";

export interface StudioRequest {
  id: string;
  eventId: string;
  serviceType: StudioServiceType;
  title: string;
  description?: string;
  estimatedCost?: number;
  estimatedDays?: number;
  status: StudioRequestStatus;
  quotedCost?: number;
  quotedDays?: number;
  approvedBy?: string;
  approvedAt?: string;
  deliveredAt?: string;
  customerVisible: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface BriefingResponse {
  id: string;
  eventId: string;
  formType: string;
  responses: Record<string, unknown>;
  isSubmitted: boolean;
  submittedBy?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  eventId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
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

export const HEALTH_CONFIG: Record<
  HealthStatus,
  { label: string; color: string }
> = {
  green: { label: "On Track", color: "badge-green" },
  amber: { label: "At Risk", color: "badge-amber" },
  red: { label: "Blocked", color: "badge-red" },
};

// ============================================================
// Delivery Lifecycle Types — Phase 1
// ============================================================

/**
 * Discriminated union of legacy notification trigger types.
 *
 * Retained for backwards compatibility with rows written before the
 * unified spine landed. New code should reference
 * `NotificationKind` from `@/lib/notifications/archetypes`, which is the
 * canonical vocabulary. The `type` column in the DB stays free-text so
 * both can coexist during the migration.
 */
export type NotificationType =
  | "stage_change"
  | "approval_decision"
  | "asset_uploaded"
  | "deadline_approaching"
  | "message_received"
  | "studio_update"
  | (string & {});

/** An in-app notification delivered to a specific user */
export interface Notification {
  id: string;
  userId: string;
  eventId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  /** Canonical archetype slug — see `@/lib/notifications/archetypes`. */
  kind?: string | null;
  priority?: "low" | "normal" | "high";
  actionRequired?: boolean;
  entityType?: string | null;
  entityId?: string | null;
}

/** A message in the per-event messaging thread */
export interface Message {
  id: string;
  eventId: string;
  senderId: string;
  senderName?: string;
  body: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

/** A reusable template for bootstrapping events with pre-defined milestones, tasks, assets, and QA checklists */
export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  eventType: EventType;
  packageType: PackageType;
  machineType?: string;
  milestonesJson: Record<string, unknown>[];
  tasksJson: Record<string, unknown>[];
  assetsJson: Record<string, unknown>[];
  qaItemsJson: Record<string, unknown>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** QA check result status */
export type QAItemStatus = "pending" | "passed" | "failed" | "fixed" | "na";

/** QA checklist category groupings */
export type QACategory =
  | "machine"
  | "game_logic"
  | "ux_ui"
  | "webform"
  | "wrap"
  | "logistics"
  | "product"
  | "other";

/** A single QA checklist item tied to an event */
export interface QAItem {
  id: string;
  eventId: string;
  category: QACategory;
  title: string;
  description?: string;
  status: QAItemStatus;
  testedBy?: string;
  testedAt?: string;
  failureReason?: string;
  fixDescription?: string;
  fixedBy?: string;
  fixedAt?: string;
  evidenceUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Logistics entry classification */
export type LogisticsEntryType = "delivery" | "setup" | "collection" | "other";

/** Logistics fulfilment status */
export type LogisticsStatus =
  | "pending"
  | "confirmed"
  | "in_transit"
  | "completed"
  | "issue";

/** A logistics line-item (delivery, setup, collection) for an event */
export interface LogisticsEntry {
  id: string;
  eventId: string;
  entryType: LogisticsEntryType;
  title: string;
  description?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status: LogisticsStatus;
  contactName?: string;
  contactPhone?: string;
  trackingReference?: string;
  notes?: string;
  completedAt?: string;
  completedBy?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Quoting Types — Phase 3
// ============================================================

/** Which quoting track the request came through */
export type QuoteTrack = "book_now" | "proposal";

/** Quote lifecycle status */
export type QuoteStatus =
  | "draft"
  | "submitted"
  | "proposal_sent"
  | "accepted"
  | "declined"
  | "expired";

/** A quote/booking request from either track */
export interface Quote {
  id: string;
  track: QuoteTrack;
  status: QuoteStatus;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  packageId?: string;
  machinePreference?: string;
  gamePreference?: string;
  addons: string[];
  eventType?: string;
  objective?: string;
  venueName?: string;
  postcode?: string;
  eventDateStart?: string;
  eventDateEnd?: string;
  footfallEstimate?: string;
  creativeNeeds?: string;
  specialRequirements?: string;
  budgetIndication?: string;
  proposalNotes?: string;
  lineItems: QuoteLineItem[];
  totalAmount?: number;
  estimatedInteractions?: number;
  estimatedLeads?: number;
  estimatedImpressions?: number;
  expiresAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** A single line item on a proposal */
export interface QuoteLineItem {
  id: string;
  quoteId: string;
  label: string;
  amount: number;
  category?: string;
  sortOrder: number;
}

/** Postcode prefix → pricing tier mapping */
export interface LocationTier {
  id: string;
  postcodePrefix: string;
  name: string;
  region: string;
  tier: string;
  multiplier: number;
}

// ============================================================
// Catalog Types — Phase 2
// ============================================================

/** Machine hardware unit in the catalog */
export interface Machine {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  specsJson: Record<string, unknown>;
  dimensions?: string;
  heroImageUrl?: string;
  galleryUrls: string[];
  videoUrl?: string;
  capabilities: string[];
  isActive: boolean;
  sortOrder: number;
}

/** Game software that runs on machines */
export interface Game {
  id: string;
  name: string;
  slug: string;
  description?: string;
  previewVideoUrl?: string;
  thumbnailUrl?: string;
  suitableFor: string[];
  category?: string;
  objectives: string[];
  crowdGuidance?: string;
  isActive: boolean;
  sortOrder: number;
}

/** Bookable package combining machine, configuration, and pricing */
export interface Package {
  id: string;
  name: string;
  slug: string;
  description?: string;
  machineId?: string;
  tier: string;
  basePrice?: number;
  durationDays?: number;
  featuresJson: string[];
  isBookable: boolean;
  sortOrder: number;
}

/** Add-on item for a package */
export interface PackageAddon {
  id: string;
  packageId: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
}

/** Published case study showcasing a past event */
export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  clientName?: string;
  eventType?: string;
  location?: string;
  description?: string;
  heroImageUrl?: string;
  galleryUrls: string[];
  statsJson: Record<string, unknown>;
  testimonialQuote?: string;
  testimonialAuthor?: string;
  isPublished: boolean;
  publishedAt?: string;
}

// ============================================================
// Reporting Types — Phase 5
// ============================================================

/** Discriminated report type for proof-of-performance reports */
export type ReportType = "post_event" | "mid_event" | "custom";

/** A generated proof-of-performance report for an event */
export interface EventReport {
  id: string;
  eventId: string;
  reportType: ReportType;
  title: string;
  metricsJson: Record<string, unknown>;
  predictionsJson: Record<string, unknown>;
  comparisonJson: Record<string, unknown>;
  highlightsJson: Record<string, unknown>[];
  shareToken?: string;
  generatedAt: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Aggregate performance benchmark by category */
export interface Benchmark {
  id: string;
  eventType: string;
  locationTier?: string;
  machineType?: string;
  gameType?: string;
  metricName: string;
  avgValue?: number;
  medianValue?: number;
  p25Value?: number;
  p75Value?: number;
  sampleSize: number;
  updatedAt: string;
}

// ============================================================
// Telemetry Types — Phase 4
// ============================================================

/** Operational status of a physical machine instance */
export type MachineInstanceStatus =
  | "available"
  | "deployed"
  | "maintenance"
  | "retired";

/** Discriminated union of telemetry event classifications */
export type TelemetryEventType =
  | "play_started"
  | "play_completed"
  | "lead_captured"
  | "prize_awarded"
  | "heartbeat"
  | "error";

/** A physical machine deployed to events, tracked by serial number */
export interface MachineInstance {
  id: string;
  machineTypeId: string;
  serialNumber: string;
  nickname?: string;
  currentEventId?: string;
  currentPlacementId?: string;
  status: MachineInstanceStatus;
  lastHeartbeat?: string;
  firmwareVersion?: string;
  createdAt: string;
  updatedAt: string;
}

/** A single telemetry data point emitted by a machine during an event */
export interface TelemetryEvent {
  id: string;
  machineInstanceId: string;
  eventId: string;
  eventType: TelemetryEventType;
  payloadJson: Record<string, unknown>;
  timestamp: string;
}

/** A lead captured via a machine interaction at an event */
export interface Lead {
  id: string;
  eventId: string;
  machineInstanceId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  customFieldsJson: Record<string, unknown>;
  source: string;
  capturedAt: string;
}

/** Aggregated event metrics for a single calendar day */
export interface EventMetricsSnapshot {
  id: string;
  eventId: string;
  snapshotDate: string;
  totalPlays: number;
  totalInteractions: number;
  totalLeads: number;
  totalPrizes: number;
  avgDwellTime?: number;
  peakHour?: number;
  customJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Partner Types — Phase 6
// ============================================================

/** Classification of partner organisation */
export type PartnerType = "reseller" | "venue" | "agency";

/** Partner lifecycle status */
export type PartnerStatus = "pending" | "active" | "suspended" | "inactive";

/** Commission payment lifecycle status */
export type CommissionStatus = "pending" | "approved" | "paid";

/** A reseller, venue, or agency partner organisation */
export interface Partner {
  id: string;
  name: string;
  slug: string;
  type: PartnerType;
  contactName?: string;
  contactEmail?: string;
  logoUrl?: string;
  brandColor?: string;
  partnerCode: string;
  commissionModelJson: Record<string, unknown>;
  status: PartnerStatus;
  onboardedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** A user linked to a partner organisation */
export interface PartnerUser {
  id: string;
  partnerId: string;
  profileId: string;
  role: "member" | "admin";
  createdAt: string;
}

/** Tracks a partner-attributed quote and its commission */
export interface PartnerAttribution {
  id: string;
  partnerId: string;
  quoteId?: string;
  eventId?: string;
  commissionAmount?: number;
  commissionStatus: CommissionStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Intelligence & Scale Types — Phase 8
// ============================================================

/** Campaign lifecycle status */
export type CampaignStatus = "draft" | "active" | "completed" | "archived";

/** Recommendation engine category classification */
export type RecommendationCategory =
  | "machine_game_combo"
  | "package_for_objective"
  | "location_performance";

/** A campaign grouping multiple events across locations */
export interface Campaign {
  id: string;
  accountId?: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  sharedCreativeJson: Record<string, unknown>;
  aggregateMetricsJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Links an event to a campaign with ordering */
export interface CampaignEvent {
  id: string;
  campaignId: string;
  eventId: string;
  sortOrder: number;
  createdAt: string;
}

/** A materialized recommendation from the engine */
export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  contextJson: Record<string, unknown>;
  recommendationJson: Record<string, unknown>;
  confidenceScore?: number;
  sampleSize: number;
  updatedAt: string;
}

/** An API key for public REST access (key_hash excluded for security) */
export interface ApiKey {
  id: string;
  accountId?: string;
  partnerId?: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

/** A webhook subscription for event lifecycle notifications */
export interface WebhookSubscription {
  id: string;
  accountId?: string;
  partnerId?: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  failureCount: number;
  createdAt: string;
}

// ============================================================
// Venue & Runway Types — Phase 7
// ============================================================

/** Classification of physical venue */
export type VenueType =
  | "convention_centre"
  | "shopping_centre"
  | "hotel"
  | "arena"
  | "other";

/** Placement lifecycle status */
export type PlacementStatus = "planned" | "active" | "completed" | "cancelled";

/** Sponsorship slot availability status */
export type SponsorshipSlotStatus =
  | "available"
  | "reserved"
  | "active"
  | "completed";

/** A physical venue that hosts Bright.Blue machines */
export interface Venue {
  id: string;
  partnerId?: string;
  name: string;
  slug: string;
  address?: string;
  postcode?: string;
  locationTier?: string;
  capacity?: number;
  venueType?: VenueType;
  contactInfoJson: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A machine placed at a venue for a defined period */
export interface Placement {
  id: string;
  venueId: string;
  machineInstanceId?: string;
  startDate: string;
  endDate?: string;
  status: PlacementStatus;
  pricingModelJson: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** A sponsorship slot on a placement available for booking */
export interface SponsorshipSlot {
  id: string;
  placementId: string;
  sponsorAccountId?: string;
  startDate: string;
  endDate: string;
  price?: number;
  status: SponsorshipSlotStatus;
  creativeAssetIds: string[];
  gameConfigJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** An event package offered by a venue that may include Bright.Blue */
export interface VenuePackage {
  id: string;
  venueId: string;
  name: string;
  description?: string;
  price?: number;
  includesBrightBlue: boolean;
  brightBluePackageId?: string;
  sortOrder: number;
  createdAt: string;
}

