/**
 * Shared shapes for scheduled and on-demand exports.
 *
 * Kept out of the action file so the server-only builder
 * (`src/server/exports.ts`) and the client manager can both import them without
 * pulling in a Server Action module.
 */

export type ExportFrequency = "daily" | "weekly" | "end_of_event" | "on_demand";
export type ExportFormat = "csv" | "excel" | "pdf";
export type ExportField = "leads" | "scores" | "metrics" | "custom_fields";

export interface ScheduledExport {
  id: string;
  eventId: string;
  frequency: ExportFrequency;
  format: ExportFormat;
  includeFields: ExportField[];
  recipients: string[];
  isActive: boolean;
  lastSentAt: string | null;
  nextSendAt: string | null;
  createdAt: string;
}
