/** Event intake & setup content: briefing responses and reusable templates. */

import type { EventType, PackageType } from "./core";

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
