/** Zod schemas for team member request, approval, and removal actions. */
import { z } from "zod";
import { uuidLike } from "./id";

/** Input for `inviteTeammate` (lead-contact self-serve invite). */
export const inviteTeammateSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  asAdmin: z.boolean(),
});

/**
 * Input for `requestTeamMember`. `roleLabel` may be empty — the action
 * falls back to "Team Member".
 */
export const requestTeamMemberSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  email: z.string().email("Enter a valid email address."),
  roleLabel: z.string(),
});

/** Input for `approveTeamMember`. */
export const approveTeamMemberSchema = z.object({
  memberId: uuidLike("Invalid member ID"),
});

/** Input for `rejectTeamMember`. */
export const rejectTeamMemberSchema = z.object({
  memberId: uuidLike("Invalid member ID"),
});

/** Input for `removeTeamMember`. */
export const removeTeamMemberSchema = z.object({
  memberId: uuidLike("Invalid member ID"),
});
