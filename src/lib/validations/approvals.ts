/** Zod schemas for approval decision validation */
import { z } from "zod";
import { uuidLike } from "./id";

export const approvalDecisionSchema = z.object({
  approvalId: uuidLike("Invalid approval ID"),
  decision: z.enum(["approved", "rejected", "revision_requested"]),
  feedback: z.string().optional(),
});

export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
