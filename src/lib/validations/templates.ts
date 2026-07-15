/** Zod schemas for event template management actions */
import { z } from "zod";
import { uuidLike } from "./id";

export const createTemplateSchema = z.object({
  name: z.string().min(2, "Template name is required (min 2 chars)."),
  description: z.string().max(5000, "Description must be under 5000 characters").nullable(),
  eventType: z.enum(["activation", "sampling", "vending", "hybrid", "custom"]),
  packageType: z.enum(["standard", "premium", "custom"]),
});

export const saveTemplateDataSchema = z.object({
  templateId: uuidLike("Invalid template ID"),
  milestones_json: z.array(z.unknown()).optional(),
  tasks_json: z.array(z.unknown()).optional(),
  assets_json: z.array(z.unknown()).optional(),
  qa_items_json: z.array(z.unknown()).optional(),
  compliance_json: z.array(z.unknown()).optional(),
  venue_requirements_json: z.array(z.unknown()).optional(),
  game_config_defaults_json: z.record(z.string(), z.unknown()).nullable().optional(),
  product_config_defaults_json: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const saveEventAsTemplateSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  templateName: z.string().min(1, "Template name is required"),
});
