/** Zod schemas for post-play journey configuration actions. */
import { z } from "zod";
import { uuidLike } from "./id";

export const JOURNEY_KINDS = ["where_to_buy", "review", "discount"] as const;
export type JourneyKind = (typeof JOURNEY_KINDS)[number];

/** Structured input for `saveJourney` (create or replace an event's journey). */
export const saveJourneySchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  kind: z.enum(JOURNEY_KINDS),
  headline: z.string().min(1, "Headline is required").max(120),
  body: z.string().max(1000).optional(),
  ctaLabel: z.string().min(1, "Button label is required").max(40),
  ctaUrl: z
    .string()
    .url("Enter a full URL")
    .max(500)
    .refine((u) => u.startsWith("https://"), "URL must use https"),
  discountCode: z.string().max(40).optional(),
  isActive: z.boolean(),
});

export type SaveJourneyInput = z.infer<typeof saveJourneySchema>;
