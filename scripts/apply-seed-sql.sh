#!/usr/bin/env bash
#
# Apply supabase/seed.sql to the running local stack.
#
# `db.seed` is disabled in config.toml because the file inserts profiles that
# reference auth.users rows only created by seed-users.ts, so `supabase db
# reset` cannot load it. It therefore has to be applied here, after the auth
# users exist and before run-seed.ts, which builds on the catalogue rows.
#
# Not every statement in the file carries `on conflict do nothing`, and several
# insert rows with generated ids, so re-applying it over a populated database
# would duplicate data. The catalogue is the sentinel: if machines are already
# present the file has run, and re-seeding is `npm run db:reset`.
set -euo pipefail

cd "$(dirname "$0")/.."

CONTAINER=$(docker ps --filter "name=supabase_db_" --format '{{.Names}}' | head -1)
if [ -z "$CONTAINER" ]; then
  echo "No supabase_db_* container running — start the stack first (npm run db:local)." >&2
  exit 1
fi

EXISTING=$(docker exec "$CONTAINER" psql -U postgres -d postgres -tAc \
  "select count(*) from machines" 2>/dev/null || echo 0)

if [ "$EXISTING" -gt 0 ]; then
  echo "Catalogue already present ($EXISTING machines) — skipping seed.sql. Use npm run db:reset to re-seed."
  exit 0
fi

docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < supabase/seed.sql
echo "seed.sql applied"
