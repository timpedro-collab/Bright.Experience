/** Zod schemas for approval decision validation */
import { z } from "zod";

export const approvalDecisionSchema = z.object({
  approvalId: z.string().uuid("Invalid approval ID"),
  decision: z.enum(["approved", "rejected", "revision_requested"]),
  feedback: z.string().optional(),
});

export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
