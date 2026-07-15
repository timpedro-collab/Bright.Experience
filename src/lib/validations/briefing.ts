/** Zod schemas for briefing form submissions */
import { z } from "zod";
import { uuidLike } from "./id";

/** Longest answer we accept for a single briefing question. */
export const MAX_ANSWER_LENGTH = 5000;

/**
 * Structured input for `saveBriefingResponse`. Briefings are free-form
 * question/answer blobs keyed by snake_case question ids (the creative and
 * ops forms each define their own field sets, and the brand kit merges into
 * the creative blob), so responses are validated as a bounded string record
 * rather than a fixed shape.
 */
export const briefingResponseSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  formType: z.enum(["creative", "ops"]),
  responses: z.record(
    z.string(),
    z
      .string()
      .max(MAX_ANSWER_LENGTH, `Answers must be under ${MAX_ANSWER_LENGTH} characters`)
  ),
  submit: z.boolean(),
});

export type BriefingResponseInput = z.infer<typeof briefingResponseSchema>;
