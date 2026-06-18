/** Logistics types — delivery, setup, and collection line-items per event. */

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
