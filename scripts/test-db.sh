#!/usr/bin/env bash
# Database test runner. Builds throwaway PostgreSQL databases (with Supabase stand-ins)
# and runs every suite against TWO starting points:
#   fresh       all repository migrations on an empty database
#   live-clone  baseline migrations (<= 20261114000200), then the audited live drift
#               (supabase/tests/fixtures/live_drift_2026-11-18.sql), a check that the
#               drift reproduces, then the new migrations, as production will see them.
# Never touches a Supabase project. Needs psql/createdb; PG* env vars select the server.
set -euo pipefail
cd "$(dirname "$0")/.."
export PGOPTIONS="-c client_min_messages=warning"   # hide routine NOTICEs, keep errors
SUITES=(supabase/tests/10_security_boundaries.sql supabase/tests/15_privilege_matrix.sql supabase/tests/20_option_a_transition.sql)
BASELINE_MAX=20261114000200
DBS=()
trap 'for d in "${DBS[@]}"; do dropdb --if-exists "$d"; done' EXIT
run() { psql -X -q -t -v ON_ERROR_STOP=1 -d "$1" -f "$2"; }
report() { sed -n 's/^.*NOTICE:  \(PASS.*\)$/  \1/p; s/^\(.*\(PASSED\|REPRODUCED\)\)$/\1/p; /FAIL\|ERROR/p'; }
version() { basename "$1" | cut -d_ -f1; }

build() { # $1=db $2=mode
  createdb "$1"; DBS+=("$1")
  run "$1" supabase/tests/00_local_supabase_stub.sql
  for f in supabase/migrations/*.sql; do
    if [ "$2" = live-clone ] && [ "$(version "$f")" -gt "$BASELINE_MAX" ] && [ -z "${DRIFTED:-}" ]; then
      run "$1" supabase/tests/fixtures/live_drift_2026-11-18.sql
      echo "   live drift applied; checking it reproduces the audit findings"
      run "$1" supabase/tests/05_live_drift_baseline.sql 2>&1 | report
      DRIFTED=1
    fi
    run "$1" "$f"
  done
  unset DRIFTED
  # every new migration must be safe to apply twice
  for f in supabase/migrations/*.sql; do
    [ "$(version "$f")" -gt "$BASELINE_MAX" ] && run "$1" "$f"
  done
  return 0
}

for mode in fresh live-clone; do
  for suite in "${SUITES[@]}"; do
    db="akh_test_$$_${#DBS[@]}"
    echo "== [$mode] $suite"
    build "$db" "$mode"
    run "$db" "$suite" 2>&1 | report
  done
done
echo "ALL DATABASE SUITES PASSED (fresh and live-clone)"
