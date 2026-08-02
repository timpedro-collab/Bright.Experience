/**
 * Zod schema for event creation.
 *
 * Lives here rather than in the action file because both the internal-role
 * gated action (`src/app/actions/events.ts`) and the service-role system path
 * (`src/server/events.ts`) validate against it.
 */

import { z } from "zod";

import { uuidLike } from "./id";

export const createEventSchema = z.object({
  accountId: uuidLike("Select a customer account"),
  name: z.string().min(2, "Give your event a name"),
  eventType: z.enum(["activation", "sampling", "vending", "hybrid", "custom"]),
  packageType: z.enum(["standard", "premium", "custom"]).default("standard"),
  machineType: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  eventDateStart: z.string().min(1, "Pick a start date"),
  eventDateEnd: z.string().optional(),
  templateId: uuidLike("Invalid template").optional(),
  pipedriveDealId: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * Flagging an event amber or red by hand.
 *
 * A reason is mandatory on amber and red: a delivery board full of unexplained
 * red dots is worse than no board at all. Clearing back to green drops the
 * reason, so it is optional there and ignored.
 */
export const setEventHealthSchema = z
  .object({
    eventId: uuidLike("Invalid event"),
    status: z.enum(["green", "amber", "red"]),
    reason: z
      .string()
      .trim()
      .max(280, "Keep the reason under 280 characters")
      .optional(),
  })
  .refine(
    (value) => value.status === "green" || (value.reason?.length ?? 0) >= 3,
    { path: ["reason"], message: "Say what's wrong so the team can pick it up" }
  );

export type SetEventHealthInput = z.infer<typeof setEventHealthSchema>;
