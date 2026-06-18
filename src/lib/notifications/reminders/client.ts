/** Shared types + time helper for the reminder engine. */

import { getServiceRoleClient } from "@/lib/supabase/service-role";

/** The service-role client the cron engine runs every query through. */
export type ReminderClient = ReturnType<typeof getServiceRoleClient>;

/** Whole + fractional hours elapsed since an ISO timestamp (0 if invalid). */
export function hoursSince(iso: string): number {
  if (!iso) return 0;
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return (now - then) / (1000 * 60 * 60);
}
