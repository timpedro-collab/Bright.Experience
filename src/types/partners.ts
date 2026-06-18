/** Partner types — resellers, venues, and agencies plus their attribution. */

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
