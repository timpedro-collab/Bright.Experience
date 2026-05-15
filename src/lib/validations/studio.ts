/** Zod schemas for Bright.Studio request validation */
import { z } from "zod";

export const studioRequestSchema = z.object({
  serviceType: z.enum([
    "design",
    "animation",
    "video",
    "photography",
    "copywriting",
    "other",
  ]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Please provide a detailed description"),
  quantity: z.number().int().positive().optional(),
  expressTurnaround: z.boolean().optional().default(false),
});

export type StudioRequestInput = z.infer<typeof studioRequestSchema>;
