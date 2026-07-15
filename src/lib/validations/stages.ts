/** Zod schemas for event stage transition actions */
import { z } from "zod";
import { uuidLike } from "./id";

/**
 * Structured input for `advanceStage`. The target stage is never taken from
 * the caller — it is derived server-side from `STAGE_CONFIG` order — so the
 * only user-supplied input to validate is the event id.
 */
export const advanceStageSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
});

export type AdvanceStageInput = z.infer<typeof advanceStageSchema>;
