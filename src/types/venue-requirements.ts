/** Shared venue requirement types and constants. */

export type VenueRequirementType =
  | "exhibitor_manual"
  | "power_spec"
  | "loading_access"
  | "insurance_minimum"
  | "h_and_s"
  | "wifi"
  | "parking"
  | "floor_plan"
  | "build_schedule"
  | "other";

export interface VenueRequirement {
  id: string;
  eventId: string;
  requirementType: VenueRequirementType;
  description: string;
  documentUrl: string | null;
  isMet: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const REQUIREMENT_TYPE_LABELS: Record<VenueRequirementType, string> = {
  exhibitor_manual: "Exhibitor Manual",
  power_spec: "Power Specification",
  loading_access: "Loading / Access Details",
  insurance_minimum: "Insurance Minimum",
  h_and_s: "Health & Safety",
  wifi: "WiFi Requirements",
  parking: "Parking",
  floor_plan: "Floor Plan",
  build_schedule: "Build Schedule",
  other: "Other",
};
