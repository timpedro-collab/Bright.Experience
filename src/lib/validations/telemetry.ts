/** Zod schemas for telemetry and lead capture validation. */
import { z } from "zod";

import { uuidLike } from "./id";

export const ingestTelemetrySchema = z.object({
  machineSerial: z.string().min(1, "Machine serial is required"),
  eventId: uuidLike("Valid event ID is required"),
  eventType: z.enum([
    "play_started",
    "play_completed",
    "lead_captured",
    "prize_awarded",
    "heartbeat",
    "error",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type IngestTelemetryInput = z.infer<typeof ingestTelemetrySchema>;

export const captureLeadSchema = z.object({
  eventId: uuidLike("Valid event ID is required"),
  machineInstanceId: uuidLike("Invalid machine").optional(),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

export type CaptureLeadInput = z.infer<typeof captureLeadSchema>;
