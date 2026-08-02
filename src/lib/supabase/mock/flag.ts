/**
 * Mock-mode flag + shared cookie name.
 *
 * When `NEXT_PUBLIC_MOCK_MODE` is on, the app swaps the real Supabase client
 * for an in-memory mock (see ./client). This lets the entire frontend run with
 * no backend — clone, install, run. Auth is faked via a cookie that holds the
 * id of the seeded profile you "logged in" as, so you can still switch between
 * customer and internal personas through the normal login screen.
 */

export const MOCK_COOKIE = "bx_mock_uid";

let warned = false;

/**
 * True when the app should use the in-memory mock instead of real Supabase.
 *
 * Mock mode accepts any password, issues no JWT and bypasses RLS entirely, so a
 * production build refuses to honour it. The flag lives in `.env.development`
 * (never loaded by `next build`), and this check is the backstop for the case
 * where the variable is set in a hosting provider's environment instead.
 */
export function isMockMode(): boolean {
  const v = process.env.NEXT_PUBLIC_MOCK_MODE;
  if (v !== "1" && v !== "true") return false;

  // Written as a literal so Next inlines it into client bundles too — a dynamic
  // process.env lookup would be undefined in the browser and the two runtimes
  // would disagree about whether mock mode is on.
  // Set only by the E2E harness, which builds in production mode but has no
  // Postgres to point at. The name is deliberately alarming: anything that sets
  // it in a real deployment has turned authentication off.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ALLOW_INSECURE_MOCK_AUTH !== "1"
  ) {
    if (!warned) {
      warned = true;
      console.error(
        "[security] NEXT_PUBLIC_MOCK_MODE is set in a production build and has been ignored. " +
          "Mock mode disables authentication and RLS. Remove the variable, or set " +
          "NEXT_PUBLIC_ALLOW_INSECURE_MOCK_AUTH=1 if this is a throwaway demo " +
          "deployment holding no real data."
      );
    }
    return false;
  }

  return true;
}
