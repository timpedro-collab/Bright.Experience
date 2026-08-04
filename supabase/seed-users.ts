import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load env from .env.local (gitignored) so secrets never live in code.
function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local is optional in CI */
  }
}
loadEnvLocal();

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local before seeding.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "tim@brightblue.co.uk",
    password: "demo-password-123",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "james.chen@cocacola.com",
    password: "demo-password-123",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "theo@brightblue.co.uk",
    password: "demo-password-123",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "dan@brightblue.co.uk",
    password: "demo-password-123",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    email: "alex@brightblue.co.uk",
    password: "demo-password-123",
  },
  // Venue operator persona — Westfield Stratford (partner e3e3…, venue f2f2…).
  {
    id: "99999999-9999-9999-9999-999999999999",
    email: "daniel@westfield-stratford.com",
    password: "demo-password-123",
  },
];

async function seed() {
  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
    } else {
      console.log(`Created user: ${data.user.email} (${data.user.id})`);
    }
  }

  console.log("\nAll demo users use password: demo-password-123");
}

seed();
