/** Zod schemas for approval decision validation */
import { z } from "zod";
import { uuidLike } from "./id";

export const approvalDecisionSchema = z.object({
  approvalId: uuidLike("Invalid approval ID"),
  decision: z.enum(["approved", "rejected", "revision_requested"]),
  feedback: z.string().optional(),
});

export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;

/**
 * The kinds of deliverable that go to the customer for sign-off. Matches the
 * `approval_type` values the delivery team has used since launch; `other`
 * exists so a new deliverable never blocks on a code change.
 */
export const APPROVAL_TYPES = [
  "wrap",
  "game_flow",
  "webform",
  "prize_selection",
  "other",
] as const;

export type ApprovalType = (typeof APPROVAL_TYPES)[number];

/** Human labels for the picker. */
export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  wrap: "Machine wrap",
  game_flow: "Game flow",
  webform: "Data-capture form",
  prize_selection: "Prize selection",
  other: "Other deliverable",
};

/**
 * A request for customer sign-off.
 *
 * `previewUrl` is either a storage path inside the private `event-assets`
 * bucket (what the asset picker submits) or an absolute link to an external
 * proof — `resolvePreviewUrl` in the approvals query handles both.
 */
export const approvalRequestSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  title: z
    .string()
    .trim()
    .min(3, "Give the proof a title the customer will recognise")
    .max(120, "Keep the title under 120 characters"),
  approvalType: z.enum(APPROVAL_TYPES),
  description: z
    .string()
    .trim()
    .max(1000, "Keep the note under 1000 characters")
    .optional(),
  previewUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .refine(
      (value) => !value || !/^(javascript|data|vbscript):/i.test(value),
      "That preview link isn't a valid location"
    ),
});

export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;
