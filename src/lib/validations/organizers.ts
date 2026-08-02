/** Zod schemas for organizer show and sponsor-slot actions. */
import { z } from "zod";
import { uuidLike } from "./id";

/** Longest sponsor name we accept on a slot. */
const MAX_SPONSOR_NAME_LENGTH = 200;

/** Input for `createShowSlot` — sells one machine on one show to a sponsor. */
export const createShowSlotSchema = z.object({
  eventId: uuidLike("Invalid show ID"),
  machineInstanceId: uuidLike("Invalid machine ID"),
  sponsorName: z
    .string()
    .max(MAX_SPONSOR_NAME_LENGTH, "Sponsor name is too long")
    .optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  price: z.number().min(0, "Price can't be negative").optional(),
});

/** Input for `assignSlotMachine` — move a sold slot to a different unit. */
export const assignSlotMachineSchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
  machineInstanceId: uuidLike("Invalid machine ID"),
});

/**
 * Input for `shareSlotPitch`. The expiry bound is deliberately short by
 * default: a pitch link is a capability URL, so it should stop working once
 * the deal is done rather than living forever in an inbox.
 */
export const shareSlotPitchSchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
  expiresInDays: z
    .number()
    .int()
    .min(1, "A pitch link must be valid for at least a day")
    .max(180, "A pitch link can't outlive the sales cycle")
    .optional(),
});

/** Input for `revokeSlotPitch`. */
export const revokeSlotPitchSchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
});

/**
 * Input for `attachSlotCreatives`. The list is the complete set for the slot,
 * not a delta, so detaching is the same call with the id removed. Bounded so
 * a malformed client can't write an unbounded array into the row.
 */
export const attachSlotCreativesSchema = z.object({
  slotId: uuidLike("Invalid slot ID"),
  assetIds: z
    .array(uuidLike("Invalid asset ID"))
    .max(20, "That's more creative than one slot can carry"),
});

/** Input for `updateMachineDeployment` — zone and mission for one unit. */
export const updateMachineDeploymentSchema = z.object({
  machineInstanceId: uuidLike("Invalid machine ID"),
  zone: z.string().max(120, "Zone name is too long").nullish(),
  mission: z
    .enum([
      "lead_capture",
      "sponsor_activation",
      "welcome_gift",
      "rebook_reward",
      "sampling",
    ])
    .nullish(),
});
