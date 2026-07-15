/** Zod schemas for task lifecycle mutations */
import { z } from "zod";
import { uuidLike } from "./id";

/**
 * Team lanes a task can be reassigned into. `admin` is deliberately
 * excluded — that category is the customer-owned lane by convention
 * (see `src/lib/ownership.ts`), so moving internal work into it would
 * silently flip ownership to the customer.
 */
export const REASSIGNABLE_CATEGORIES = [
  "creative",
  "operations",
  "qa",
  "development",
  "logistics",
  "reporting",
] as const;

export const reassignTaskSchema = z
  .object({
    taskId: uuidLike("Invalid task ID"),
    category: z.enum(REASSIGNABLE_CATEGORIES).optional(),
    /** New assignee profile id, or null to clear the personal assignment. */
    assignedToId: uuidLike("Invalid assignee ID").nullable().optional(),
  })
  .refine((v) => v.category !== undefined || v.assignedToId !== undefined, {
    message: "Nothing to reassign — provide a team or an assignee",
  });

export type ReassignTaskInput = z.infer<typeof reassignTaskSchema>;
