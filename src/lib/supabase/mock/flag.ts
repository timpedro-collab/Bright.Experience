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

export function isMockMode(): boolean {
  const v = process.env.NEXT_PUBLIC_MOCK_MODE;
  return v === "1" || v === "true";
}
