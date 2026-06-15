/** Centralised audit trail writer — replaces inline audit_entries inserts across actions. */
import { createClient } from "@/lib/supabase/server";

interface WriteAuditParams {
  eventId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Insert a single audit_entries row. Fire-and-forget — callers should
 * not block on the result. Logs failures server-side but never throws.
 */
export async function writeAudit({
  eventId,
  actorId,
  action,
  entityType,
  entityId,
  metadata = {},
}: WriteAuditParams): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_entries").insert({
      event_id: eventId,
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
    if (error) {
      console.error("[writeAudit] insert failed:", { eventId, action, error: error.message });
    }
  } catch (err) {
    console.error("[writeAudit] unexpected error:", err);
  }
}
