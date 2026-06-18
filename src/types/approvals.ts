/** Approval + Bright.Studio request types — the creative sign-off domain. */

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revision_requested";

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
