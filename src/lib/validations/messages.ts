/** Zod schemas for event messaging validation */
import { z } from "zod";

export const sendMessageSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  body: z.string().min(1, "Message body cannot be empty").max(10000),
  isInternal: z.boolean(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
