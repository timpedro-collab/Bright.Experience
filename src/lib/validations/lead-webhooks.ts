/** Zod schemas for event-scoped lead webhook subscriptions. */
import { z } from "zod";

/** HTTPS endpoint that receives `lead.captured` payloads for one event. */
export const createLeadWebhookSchema = z.object({
  eventId: z.string().uuid("Invalid event"),
  url: z
    .string()
    .url("Enter a valid URL")
    .max(500, "URL must be under 500 characters")
    .refine((value) => value.startsWith("https://"), {
      message: "Webhook URL must use HTTPS",
    }),
  description: z
    .string()
    .trim()
    .max(200, "Description must be under 200 characters")
    .optional(),
});

export type CreateLeadWebhookInput = z.infer<typeof createLeadWebhookSchema>;
