#!/usr/bin/env bash
#
# Run the dev server against local Postgres instead of the in-memory mock.
#
# Environment variables set here win over `.env.local` and `.env`, so this
# leaves whatever cloud credentials sit in those files untouched. Mock mode is
# explicitly cleared so middleware enforces real sessions and every read goes
# through RLS.
#
# Usage: npm run dev:local [-- -p 3001]
set -euo pipefail

cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker, then: npm run db:local" >&2
  exit 1
fi

eval "$(npx supabase status -o env | sed 's/^/export /')"

export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export NEXT_PUBLIC_MOCK_MODE=0
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
# A known dev secret so the cron routes and the detailed /api/health payload
# are reachable locally:
#   curl -H "Authorization: Bearer local-dev-cron-secret" localhost:3000/api/cron/reminders
export CRON_SECRET="${CRON_SECRET:-local-dev-cron-secret}"

echo "==> Dev server on local Postgres ($API_URL) — mock mode OFF, RLS ON"
exec npx next dev "$@"
