/**
 * Test-only login endpoint — creates a session for a named persona.
 *
 * Two independent gates, because this issues a real session without a password:
 * a rewrite in next.config.ts drops the whole `/api/test/*` tree from production
 * builds unless `ALLOW_TEST_AUTH_ROUTES=1`, and the handler refuses to run
 * without `TEST_MODE=1`.
 *
 * The Playwright auth fixture (`e2e/fixtures/auth.ts`) calls this with
 * `{ persona }` to bypass the UI sign-in flow during E2E journeys.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type Persona =
  | "internal_events_lead"
  | "internal_creative_lead"
  | "internal_operations_lead"
  | "internal_qa_lead"
  | "customer_admin";

/**
 * Personas map onto the demo users created by `supabase/seed-users.ts`, which
 * are the same identities the mock dataset ships. Inventing separate
 * `*@bright.test` accounts meant E2E login only ever worked against the mock
 * store, where the password is not checked.
 */
const SEED_PASSWORD = process.env.TEST_USER_PASSWORD ?? "demo-password-123";

const PERSONA_EMAILS: Record<Persona, string> = {
  internal_events_lead: "tim@brightblue.co.uk",
  internal_creative_lead: "theo@brightblue.co.uk",
  internal_operations_lead: "dan@brightblue.co.uk",
  internal_qa_lead: "alex@brightblue.co.uk",
  customer_admin: "james.chen@cocacola.com",
};

export async function POST(request: Request) {
  if (process.env.TEST_MODE !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const persona = body?.persona as Persona | undefined;

  if (!persona || !PERSONA_EMAILS[persona]) {
    return NextResponse.json(
      { error: `Invalid persona. Valid: ${Object.keys(PERSONA_EMAILS).join(", ")}` },
      { status: 400 }
    );
  }

  // Collected from the SSR client, replayed onto the response below.
  const issued: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[] = [];

  // An SSR client, not the service-role one: signing in through it writes the
  // `sb-<ref>-auth-token` cookies `@supabase/ssr` reads back on every request.
  // The previous version hand-rolled `sb-access-token`, which only the mock
  // client understands — against real Postgres the caller stayed anonymous and
  // every page bounced to /login.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: (cookiesToSet) => {
          issued.push(...cookiesToSet);
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: PERSONA_EMAILS[persona],
    password: SEED_PASSWORD,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: `Auth failed for ${persona}: ${error?.message ?? "no session"}` },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email },
  });

  for (const cookie of issued) {
    response.cookies.set(cookie.name, cookie.value, {
      path: "/",
      sameSite: "lax",
      ...cookie.options,
    });
  }

  // Legacy names, still read by the mock Supabase client behind the demo and
  // E2E runtime.
  response.cookies.set("sb-access-token", data.session.access_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
  });
  response.cookies.set("sb-refresh-token", data.session.refresh_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
  });

  return response;
}
