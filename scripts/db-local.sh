#!/usr/bin/env bash
#
# Bring the local Postgres stack up, apply every migration, and seed demo data.
#
# This is the only supported way to exercise the real security boundary: in mock
# mode (`NEXT_PUBLIC_MOCK_MODE=1`) there is no RLS, no PostgREST and no password
# check, so policies and query shapes are never executed. Run this before
# `npm run test:rls` or `npm run dev:local`.
#
# Keys are read back from the CLI rather than hardcoded, so a `supabase stop
# --no-backup` / fresh `start` cycle keeps working.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Starting local Supabase (docker must be running)"
npx supabase start

echo "==> Applying migrations"
npx supabase migration up --local

echo "==> Reading local credentials"
# `status -o env` emits KEY="value" pairs for the running stack.
eval "$(npx supabase status -o env | sed 's/^/export /')"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
unset NEXT_PUBLIC_MOCK_MODE

# seed.sql is disabled in config.toml because it references auth.users rows that
# only exist after seed-users.ts has run, so seeding is three ordered steps:
# auth users, then the declarative catalogue, then the programmatic data that
# builds on it.
echo "==> Seeding auth users"
npx tsx supabase/seed-users.ts

echo "==> Applying seed.sql (catalogue, events, assets)"
bash scripts/apply-seed-sql.sh

echo "==> Seeding application data"
npx tsx supabase/run-seed.ts

cat <<BANNER

Local stack ready.

  Studio    $STUDIO_URL
  Mail      ${MAILPIT_URL:-$INBUCKET_URL}
  API       $API_URL

Run the app against it with:  npm run dev:local
Run the RLS suite with:       npm run test:rls

BANNER
