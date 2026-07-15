/** Zod schemas for customer user invitation actions. */
import { z } from "zod";
import { uuidLike } from "./id";

/** Input for `inviteCustomerUser` (admin-gated magic-link invite). */
export const inviteCustomerUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  accountId: uuidLike("Invalid account ID"),
  role: z.enum(["customer_admin", "customer_user"]),
});

/** Input for `inviteCustomerUserSystem` — same shape as the gated variant. */
export const inviteCustomerUserSystemSchema = inviteCustomerUserSchema;
