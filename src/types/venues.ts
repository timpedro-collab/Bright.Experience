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
