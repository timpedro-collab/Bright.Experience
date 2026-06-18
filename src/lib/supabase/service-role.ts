/**
 * Privileged Supabase client — bypasses RLS by using the service-role key.
 *
 * **Server-only.** Never import this from anything that ships to the
 * browser. The cron reminder route and the daily digest job both need to
 * scan every event/asset/recipient regardless of the requesting user, so
 * they reach for this client rather than the cookie-bound one.
 */

import { createClient } from "@supabase/supabase-js";

import { isMockMode } from "./mock/flag";
import { createMockServiceClient } from "./mock/client";

// We don't yet have generated DB types — the cron just needs raw read/write
// across known shapes. Typed as `any` so writes don't trip over the
// generic-default-`never` parameter inference. If you later wire up
// generated types, swap this for a typed `SupabaseClient<Database>`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = any;

let _client: ServiceClient | null = null;

export function getServiceRoleClient(): ServiceClient {
  // Standalone mock build — no real backend. See ./mock/client.
  if (isMockMode()) {
    if (!_client) _client = createMockServiceClient();
    return _client;
  }
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service-role client not configured — set SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}
