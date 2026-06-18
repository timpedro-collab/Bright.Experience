import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isMockMode, MOCK_COOKIE } from "./lib/supabase/mock/flag";

const PUBLIC_PREFIXES = [
  "/login",
  "/auth",
  "/forgot-password",
  "/catalog",
  "/quiz",
  "/book",
  "/proposal",
  "/p/",
  "/report",
  "/partners/join",
  "/terms",
  "/privacy",
  "/how-it-works",
  "/help",
  "/api/test",
  "/help",
];

/**
 * Application-level auth gate. Public routes pass through; everything
 * else requires a session. We deliberately do *not* run the profile-
 * bootstrap inside middleware (it would add a DB roundtrip to every
 * request) — the DB trigger handles new auth.users rows, the auth
 * callback handles the post-OAuth path, and `getUser()` server-side
 * actions re-check the profile on demand.
 */
export async function middleware(request: NextRequest) {
  const pathnameEarly = request.nextUrl.pathname;
  const isPublicEarly = PUBLIC_PREFIXES.some((p) => pathnameEarly.startsWith(p));
  const isRootEarly = pathnameEarly === "/";

  // Standalone mock build: auth is a cookie holding the seeded profile id.
  if (isMockMode()) {
    const uid = request.cookies.get(MOCK_COOKIE)?.value;
    if (!uid && !isPublicEarly && !isRootEarly) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathnameEarly);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const isRoot = pathname === "/";
  if (!user && !isPublicRoute && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
