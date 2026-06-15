/**
 * Test-only login endpoint — creates a session for a named persona.
 *
 * Gated behind `TEST_MODE=1` so it can never activate in production.
 * The Playwright auth fixture (`e2e/fixtures/auth.ts`) calls this with
 * `{ persona }` to bypass the UI sign-in flow during E2E journeys.
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

type Persona =
  | "internal_admin"
  | "internal_events_lead"
  | "internal_creative_lead"
  | "customer_admin"
  | "customer_user";

const PERSONA_CREDENTIALS: Record<Persona, { email: string; password: string }> = {
  internal_admin: {
    email: "admin@bright.test",
    password: "TestPassword1!",
  },
  internal_events_lead: {
    email: "events-lead@bright.test",
    password: "TestPassword1!",
  },
  internal_creative_lead: {
    email: "creative-lead@bright.test",
    password: "TestPassword1!",
  },
  customer_admin: {
    email: "customer-admin@bright.test",
    password: "TestPassword1!",
  },
  customer_user: {
    email: "customer-user@bright.test",
    password: "TestPassword1!",
  },
};

export async function POST(request: Request) {
  if (process.env.TEST_MODE !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const persona = body?.persona as Persona | undefined;

  if (!persona || !PERSONA_CREDENTIALS[persona]) {
    return NextResponse.json(
      { error: `Invalid persona. Valid: ${Object.keys(PERSONA_CREDENTIALS).join(", ")}` },
      { status: 400 }
    );
  }

  const { email, password } = PERSONA_CREDENTIALS[persona];
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: `Auth failed for ${persona}: ${error.message}` },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email },
  });

  // Set Supabase session cookies so subsequent page navigations are authenticated.
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
