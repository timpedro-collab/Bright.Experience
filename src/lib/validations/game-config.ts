/** Zod schemas for game configuration server actions */
import { z } from "zod";
import { uuidLike } from "./id";

/** Longest free-text value we accept (labels, prize names, consent copy). */
const MAX_TEXT_LENGTH = 2000;

const prizeEntrySchema = z.object({
  name: z.string().min(1, "Prize name is required").max(MAX_TEXT_LENGTH),
  imageUrl: z.string().optional(),
  quantity: z.number().int().min(0),
  probability: z.number().min(0).max(1).optional(),
});

const formFieldEntrySchema = z.object({
  label: z.string().min(1, "Field label is required").max(MAX_TEXT_LENGTH),
  type: z.enum(["text", "email", "tel", "select", "checkbox"]),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

const captureRulesSchema = z.object({
  businessEmailsOnly: z.boolean(),
  blockedDomains: z.array(z.string().min(1).max(253)).max(500),
  blockDuplicates: z.boolean(),
  consentRequired: z.boolean(),
  consentText: z.string().max(MAX_TEXT_LENGTH),
});

/** Structured input for `saveGameConfiguration`. */
export const saveGameConfigurationSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  prizeMode: z.enum(["random", "score_based", "guaranteed"]),
  prizesJson: z.array(prizeEntrySchema).max(200),
  formFieldsJson: z.array(formFieldEntrySchema).max(50),
  includeScoreInExport: z.boolean(),
  leaderboardEnabled: z.boolean(),
  gameParametersJson: z.record(z.string(), z.unknown()),
  idleScreenConfigJson: z.record(z.string(), z.unknown()),
  captureRulesJson: captureRulesSchema,
  retentionDays: z
    .number()
    .int()
    .min(1, "Retention must be at least 1 day")
    .max(730, "Retention cannot exceed 2 years"),
  brandedLanding: z.boolean(),
  captureMethod: z.enum(["form", "badge_scan", "both"]).optional(),
  /** Null (or absent) writes the show-wide default; a uuid overrides one unit. */
  machineInstanceId: uuidLike("Invalid machine ID").nullish(),
});

export type SaveGameConfigurationInput = z.infer<
  typeof saveGameConfigurationSchema
>;
