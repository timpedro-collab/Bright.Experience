/**
 * Harness for the local-Postgres integration suite.
 *
 * Query modules reach for `createClient()` from `@/lib/supabase/server`, which
 * needs Next's request-scoped cookie store. Here we swap that (in
 * `vitest.integration.setup.ts`) for a real `supabase-js` client carrying a
 * genuine session for a seeded persona — so RLS applies exactly as it does in
 * production, and a query that PostgREST rejects fails the test.
 */
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

/**
 * Seeded personas from `supabase/seed-users.ts`. Passwords are the shared demo
 * password — these accounts only ever exist on a local stack.
 */
export const PERSONAS = {
  /** Bright.Blue admin — sees every account. */
  internal: { email: "tim@brightblue.co.uk", password: "demo-password-123" },
  /** Coca-Cola buyer — sees one account's events. */
  customer: {
    email: "james.chen@cocacola.com",
    password: "demo-password-123",
  },
} as const;

export type PersonaName = keyof typeof PERSONAS;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * True when the suite has a local stack to talk to.
 *
 * Used to skip rather than fail, so `npm run test:integration` on a machine
 * without Docker reports "skipped" instead of a wall of connection errors.
 */
export function hasLocalSupabase(): boolean {
  return Boolean(url && anonKey && url.includes("127.0.0.1"));
}

/** Skip reason surfaced when the stack isn't up. */
export const NO_LOCAL_DB =
  "local Supabase not configured — run `npm run db:local` and use `npm run test:integration`";

/** Service-role client, for arranging fixtures and reading ids. */
export function adminClient(): SupabaseClient {
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Sign in as a seeded persona and return their authenticated client. */
export async function signInAs(persona: PersonaName): Promise<SupabaseClient> {
  const client = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword(PERSONAS[persona]);
  if (error) {
    throw new Error(
      `could not sign in as ${persona} (${PERSONAS[persona].email}): ${error.message}. ` +
        "Run `npm run db:seed`."
    );
  }
  return client;
}

let activeClient: SupabaseClient | null = null;

/** Point `@/lib/supabase/server` at this client for subsequent calls. */
export function setActiveClient(client: SupabaseClient | null): void {
  activeClient = client;
}

/** The client the mocked `createClient()` hands to query code. */
export function getActiveClient(): SupabaseClient {
  if (!activeClient) {
    throw new Error(
      "no active Supabase client — call setActiveClient(await signInAs(...)) first"
    );
  }
  return activeClient;
}

/**
 * Query failures recorded via the mocked `logQueryError`.
 *
 * Query functions swallow errors and return `[]`, so an empty result is
 * ambiguous: no rows, or a rejected request? Since every swallow site now
 * reports through `logQueryError`, an empty log is the assertion that the
 * request actually reached Postgres and came back clean.
 */
export interface RecordedQueryError {
  operation: string;
  message: string;
}

const recordedErrors: RecordedQueryError[] = [];

/** Called by the mocked logger in the setup file. */
export function recordQueryError(error: RecordedQueryError): void {
  recordedErrors.push(error);
}

/** Clear the log — call in `beforeEach`. */
export function resetQueryErrors(): void {
  recordedErrors.length = 0;
}

/** Everything logged since the last reset. */
export function queryErrors(): RecordedQueryError[] {
  return [...recordedErrors];
}
