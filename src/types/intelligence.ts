/** Intelligence & scale types — campaigns, recommendations, and API access. */

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
