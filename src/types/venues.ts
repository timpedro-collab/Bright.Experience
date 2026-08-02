/** Venue & runway types — venues, placements, and sponsorship slots. */

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

/**
 * A sponsorship slot available for booking.
 *
 * Dual-scoped: either a venue placement (`placementId`, the Bright.Runway
 * path) or a show machine (`eventId` + `machineInstanceId`, the organizer
 * path). Exactly one scope is set, enforced by
 * `sponsorship_slots_scope_check`.
 */
export interface SponsorshipSlot {
  id: string;
  placementId?: string;
  eventId?: string;
  machineInstanceId?: string;
  sponsorAccountId?: string;
  /** Brand name, captured when the sponsor has no account yet. */
  sponsorName?: string;
  startDate: string;
  endDate: string;
  price?: number;
  status: SponsorshipSlotStatus;
  creativeAssetIds: string[];
  gameConfigJson: Record<string, unknown>;
  /** Unguessable token for the public pitch page. Null until shared. */
  pitchToken?: string;
  pitchTokenExpiresAt?: string;
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
