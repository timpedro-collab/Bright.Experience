/** Zod schemas for QA checklist item validation */
import { z } from "zod";

const qaItemStatusSchema = z.enum([
  "pending",
  "passed",
  "failed",
  "fixed",
  "na",
]);

const qaCategorySchema = z.enum([
  "machine",
  "game_logic",
  "ux_ui",
  "webform",
  "wrap",
  "logistics",
  "product",
  "other",
]);

export const updateQAItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  status: qaItemStatusSchema,
  notes: z.string().optional(),
}).refine(
  (data) => !(data.status === "failed" && !data.notes),
  { message: "Failure reason is required when marking as failed", path: ["notes"] }
);

export const addQAItemSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  category: qaCategorySchema,
  description: z.string().max(1000).optional(),
});

export type UpdateQAItemInput = z.infer<typeof updateQAItemSchema>;
export type AddQAItemInput = z.infer<typeof addQAItemSchema>;
