/** Zod schemas for campaign management actions */
import { z } from "zod";
import { uuidLike } from "./id";

/**
 * `status` stays a plain string here: `createCampaign` intentionally coerces
 * unknown statuses to "draft" rather than rejecting them.
 */
export const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().max(5000, "Description must be under 5000 characters").optional(),
  accountId: uuidLike("Invalid account ID").optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

/** add/remove share the same campaign+event pair. */
const campaignEventPairSchema = z.object({
  campaignId: uuidLike("Invalid campaign ID"),
  eventId: uuidLike("Invalid event ID"),
});

export const addEventToCampaignSchema = campaignEventPairSchema;
export const removeEventFromCampaignSchema = campaignEventPairSchema;

export const updateCampaignStatusSchema = z.object({
  id: uuidLike("Invalid campaign ID"),
  status: z.enum(["draft", "active", "completed", "archived"]),
});

export const duplicateEventForCampaignSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  newDates: z.object({
    start: z.string().min(1, "Start date is required"),
    end: z.string().min(1, "End date is required"),
  }),
  newLocation: z.string().optional(),
});
