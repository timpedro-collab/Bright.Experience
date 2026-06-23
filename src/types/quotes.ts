/** Quoting types — the two-track (book-now / proposal) request model. */

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
  contactRole?: string;
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
  engagementScope?: string;
  proposalNotes?: string;
  lineItems: QuoteLineItem[];
  totalAmount?: number;
  estimatedInteractions?: number;
  estimatedLeads?: number;
  estimatedImpressions?: number;
  /** Reach track: "tradeshow" | "experiential". */
  reachTrack?: string;
  /** Expected attendees (tradeshow track). */
  attendees?: number;
  /** Experiential activation site (display name + curated key). */
  activationLocation?: string;
  activationLocationKey?: string;
  /** Days on site (experiential track). */
  activationDays?: number;
  /** Rough event timeline answer from the quiz. */
  eventTimeline?: string;
  /** Equivalent out-of-home media value, in integer USD cents (experiential). */
  doohMediaValue?: number;
  /** In-app walkthrough booking. */
  walkthroughScheduledAt?: string;
  walkthroughSlotLabel?: string;
  walkthroughUrl?: string;
  walkthroughCompletedAt?: string;
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

/** Postcode prefix → pricing tier mapping (matches `locations` table) */
export interface LocationTier {
  postcodePrefix: string;
  name: string;
  region: string;
  tier: string;
  footfallIndex: number | null;
  mediaValueMultiplier: number;
  notes: string | null;
}
