/** Zod schemas for creative briefing form validation */
import { z } from "zod";

export const briefingFormSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  campaignObjective: z.string().min(10, "Please describe the campaign objective"),
  targetAudience: z.string().optional(),
  keyMessages: z.string().optional(),
  brandGuidelines: z.string().optional(),
  colorPreferences: z.string().optional(),
  inspirationLinks: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type BriefingFormInput = z.infer<typeof briefingFormSchema>;
