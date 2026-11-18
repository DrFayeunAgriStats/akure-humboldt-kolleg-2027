#!/usr/bin/env bash
# Applies every migration to throwaway local PostgreSQL databases (with Supabase
# stand-ins) and runs the database test suites. Never touches a Supabase project.
# Usage: scripts/test-db.sh   (needs psql/createdb; PG* env vars select the server)
set -euo pipefail
cd "$(dirname "$0")/.."
SUITES=(supabase/tests/10_security_boundaries.sql supabase/tests/20_option_a_transition.sql)
DBS=()
trap 'for d in "${DBS[@]}"; do dropdb --if-exists "$d"; done' EXIT
export PGOPTIONS="-c client_min_messages=warning"   # hide routine NOTICEs, keep errors
run() { psql -X -q -t -v ON_ERROR_STOP=1 -d "$1" -f "$2"; }

for suite in "${SUITES[@]}"; do
  DB="akh_test_$$_${#DBS[@]}"; DBS+=("$DB")
  createdb "$DB"
  run "$DB" supabase/tests/00_local_supabase_stub.sql
  for f in supabase/migrations/*.sql; do run "$DB" "$f"; done
  if [ "${#DBS[@]}" -eq 1 ]; then
    echo "-- all migrations applied; re-applying the 2026-11-17/18 migrations to prove they are idempotent"
    for f in supabase/migrations/2026111[78]*.sql; do run "$DB" "$f"; done
  fi
  echo "== $suite"
  run "$DB" "$suite" 2>&1 | sed -n 's/^.*NOTICE:  \(PASS.*\)$/  \1/p; s/^\(.*TESTS PASSED\)$/\1/p; /FAIL\|ERROR/p'
done
