/** Zod schemas for logistics entry validation */
import { z } from "zod";

export const logisticsEntryTypeSchema = z.enum([
  "delivery",
  "setup",
  "collection",
  "other",
]);

export const logisticsStatusSchema = z.enum([
  "pending",
  "confirmed",
  "in_transit",
  "completed",
  "issue",
]);

export const updateLogisticsEntrySchema = z.object({
  entryId: z.string().min(1, "Entry ID is required"),
  status: logisticsStatusSchema.optional(),
  notes: z.string().max(2000).optional(),
  completedAt: z.string().datetime().optional(),
});

export const addLogisticsEntrySchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  entryType: logisticsEntryTypeSchema,
  title: z.string().min(1, "Title is required").max(200),
  scheduledDate: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export type UpdateLogisticsEntryInput = z.infer<typeof updateLogisticsEntrySchema>;
export type AddLogisticsEntryInput = z.infer<typeof addLogisticsEntrySchema>;
