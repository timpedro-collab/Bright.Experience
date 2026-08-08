/**
 * Read queries for the invoice mirror — currently just the sequencing check
 * behind "invoice before report" on the publish banner.
 */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Invoice states that mean the ask has already gone out. */
const ISSUED_STATUSES = new Set(["issued", "paid", "overdue"]);

/**
 * True when at least one invoice for the event has been issued (or beyond).
 * Used to nudge publishers to invoice before the report reveal — never to
 * block publishing.
 */
export async function hasIssuedInvoiceForEvent(eventId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("event_id", eventId)
    .limit(10);

  if (error || !data) {
    if (error) logQueryError("hasIssuedInvoiceForEvent", error, { eventId });
    // Fail open: a broken read should not nag the publisher.
    return true;
  }
  return data.some((row) => ISSUED_STATUSES.has(String(row.status)));
}
