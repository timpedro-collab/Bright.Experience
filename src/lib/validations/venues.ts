/** Zod schemas for venue and runway management actions */
import { z } from "zod";
import { uuidLike } from "./id";

/** Prices arrive from forms as whole dollars (decimals allowed); actions convert to integer cents. */
const priceDollars = z.number().nonnegative("Price cannot be negative");

export const createVenueSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  partnerId: uuidLike("Invalid partner ID").optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  venueType: z.string().optional(),
  capacity: z.number().int("Capacity must be a whole number").nonnegative().optional(),
});

export const updateVenueSchema = z.object({
  id: uuidLike("Invalid venue ID"),
  name: z.string().min(1, "Venue name cannot be empty").optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  venueType: z.string().optional(),
  capacity: z.number().int("Capacity must be a whole number").nonnegative().optional(),
  isActive: z.boolean().optional(),
  contactInfoJson: z.record(z.string(), z.unknown()).optional(),
});

export const createVenuePackageSchema = z.object({
  venueId: uuidLike("Invalid venue ID"),
  name: z.string().min(1, "Package name is required"),
  description: z.string().max(5000).optional(),
  price: priceDollars.optional(),
  includesBrightBlue: z.boolean().optional(),
});

export const createPlacementSchema = z.object({
  venueId: uuidLike("Invalid venue ID"),
  machineInstanceId: uuidLike("Invalid machine instance ID").optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export const updatePlacementStatusSchema = z.object({
  id: uuidLike("Invalid placement ID"),
  status: z.enum(["planned", "active", "completed", "cancelled"]),
});

export const createSponsorshipSlotSchema = z.object({
  placementId: uuidLike("Invalid placement ID"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  price: priceDollars.optional(),
});

export const reserveSlotSchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
  sponsorAccountId: uuidLike("Invalid sponsor account ID"),
  campaign: z.string().optional(),
});

/** confirm/complete/release/delete all take just the slot id. */
const slotIdOnlySchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
});

export const confirmSlotSchema = slotIdOnlySchema;
export const completeSlotSchema = slotIdOnlySchema;
export const releaseSlotSchema = slotIdOnlySchema;
export const deleteSlotSchema = slotIdOnlySchema;

export const updateSlotSchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
  price: priceDollars.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const requestVenueSlotSchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
  company: z.string().min(1, "Company is required"),
  contactName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  message: z.string().max(5000, "Message must be under 5000 characters").optional(),
});
