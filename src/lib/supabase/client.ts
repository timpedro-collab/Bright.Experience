import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isMockMode } from "./mock/flag";
import { createMockBrowserClient } from "./mock/client";

export function createClient(): SupabaseClient {
  // Standalone mock build — no real backend. See ./mock/client.
  if (isMockMode()) {
    return createMockBrowserClient() as unknown as SupabaseClient;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient;
}
