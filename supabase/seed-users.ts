import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gnlibancdyrjglwfgbym.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubGliYW5jZHlyamdsd2ZnYnltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI1MjQ0MCwiZXhwIjoyMDkwODI4NDQwfQ.Y2Xdb3Ybt41lWwXllt8PU6WS6lZx9uodN1bd96nX0Sk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "sarah@brightblue.co.uk",
    password: "demo-password-123",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "james.chen@cocacola.com",
    password: "demo-password-123",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "emma@brightblue.co.uk",
    password: "demo-password-123",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "tom@brightblue.co.uk",
    password: "demo-password-123",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    email: "alex@brightblue.co.uk",
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
