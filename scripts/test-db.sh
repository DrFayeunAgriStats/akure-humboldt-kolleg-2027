#!/usr/bin/env bash
# Applies every migration to a throwaway local PostgreSQL database (with Supabase
# stand-ins) and runs the security-boundary tests. Never touches a Supabase project.
# Usage: scripts/test-db.sh   (needs psql/createdb; PG* env vars select the server)
set -euo pipefail
cd "$(dirname "$0")/.."
DB="akh_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT
run() { psql -X -q -t -v ON_ERROR_STOP=1 -d "$DB" -f "$1"; }
run supabase/tests/00_local_supabase_stub.sql
for f in supabase/migrations/*.sql; do echo "migrate  $f"; run "$f"; done
echo "-- re-applying the new migrations to prove they are idempotent"
for f in supabase/migrations/202611170*.sql; do run "$f"; done
run supabase/tests/10_security_boundaries.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
