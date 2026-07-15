/** Zod schemas for partner lifecycle, attribution, and commission actions. */
import { z } from "zod";
import { uuidLike } from "./id";

/** Longest free-text field accepted on the partner application form. */
export const MAX_NOTES_LENGTH = 5000;

/**
 * Input for `applyAsPartner` (public onboarding wizard). The wizard offers
 * "referral" alongside the `PartnerType` union values ("reseller" | "venue" |
 * "agency"), so `type` stays a permissive non-empty string rather than a
 * strict enum.
 */
export const partnerApplicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  type: z.string().min(1, "Partnership type is required"),
  companyName: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  contactPhone: z.string().optional(),
  contactRole: z.string().optional(),
  referralSource: z.string().optional(),
  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, `Notes must be under ${MAX_NOTES_LENGTH} characters`)
    .optional(),
});

/** Input for `approvePartner`. */
export const approvePartnerSchema = z.object({
  partnerId: uuidLike("Invalid partner ID"),
});

/** Input for `suspendPartner`. */
export const suspendPartnerSchema = z.object({
  partnerId: uuidLike("Invalid partner ID"),
});

/** Input for `addPartnerUser` — role mirrors `PartnerUser["role"]`. */
export const addPartnerUserSchema = z.object({
  partnerId: uuidLike("Invalid partner ID"),
  profileId: uuidLike("Invalid profile ID"),
  role: z.enum(["member", "admin"]),
});

/**
 * Input for `recordAttribution`. Callers pass either a partner id or the
 * short partner code from the referral cookie — the action itself enforces
 * that at least one is present.
 */
export const recordAttributionSchema = z.object({
  partnerId: uuidLike("Invalid partner ID").optional(),
  partnerCode: z.string().min(1, "Invalid partner code").optional(),
  quoteId: uuidLike("Invalid quote ID"),
});

/** Input for `createPartnerQuote` (reseller "send a quote" form). Partner slugs are non-uuid. */
export const createPartnerQuoteSchema = z.object({
  slug: z.string().min(1, "Invalid partner slug"),
  contactName: z.string().min(1, "Contact name and email are required"),
  contactEmail: z.string().email("Valid email is required"),
  companyName: z.string().optional(),
  eventType: z.string().optional(),
  eventDateStart: z.string().optional(),
  estimatedValue: z
    .number()
    .min(0, "Estimated value can't be negative")
    .optional(),
});

/** Input for `approveCommission` — whole-dollar amount typed by the admin. */
export const approveCommissionSchema = z.object({
  attributionId: uuidLike("Invalid attribution ID"),
  amountDollars: z.number().positive("Commission amount must be greater than zero"),
});

/** Input for `markCommissionPaid`. */
export const markCommissionPaidSchema = z.object({
  attributionId: uuidLike("Invalid attribution ID"),
});
