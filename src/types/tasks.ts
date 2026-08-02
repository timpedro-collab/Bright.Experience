/** Task types — the actionable work items hung off milestones. */

import type { User, UserRole } from "./core";

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
  assignedRole?: UserRole;
  targetPath?: string;
  dueDate?: string;
  completedAt?: string;
  /** When set and in the future, hidden from internal focus/inbox queues. */
  snoozedUntil?: string;
  isBlocking: boolean;
  customerVisible: boolean;
  sortOrder: number;
}
