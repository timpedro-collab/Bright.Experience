import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isMockMode } from "./mock/flag";
import { createMockServerClient } from "./mock/client";

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  // Standalone mock build — no real backend. See ./mock/client.
  if (isMockMode()) {
    return createMockServerClient(cookieStore) as unknown as SupabaseClient;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore.
            // Middleware will refresh the session on the next request.
          }
        },
      },
    }
  ) as unknown as SupabaseClient;
}
