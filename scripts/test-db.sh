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
SUITES=(supabase/tests/10_security_boundaries.sql supabase/tests/15_privilege_matrix.sql supabase/tests/16_default_privileges.sql supabase/tests/20_option_a_transition.sql supabase/tests/25_abstract_revisions.sql)
BASELINE_MAX=20261114000200
DBS=()
trap 'for d in "${DBS[@]}"; do dropdb --if-exists "$d"; done' EXIT
run() { psql -X -q -t -v ON_ERROR_STOP=1 -d "$1" -f "$2"; }
report() { sed -n 's/^.*NOTICE:  \(PASS.*\)$/  \1/p; s/^\(.*\(PASSED\|REPRODUCED\)\)$/\1/p; /^psql:.*ERROR/p'; }   # failures surface as psql ERROR lines
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
# ---------------------------------------------------------------------------
# Release rehearsal on a live-like clone with sample data, using the exact files
# an operator will run: backup + verification, guarded STEP A / STEP B, rollback,
# roll forward. PG_DUMP may point at a pg_dump matching the server version.
# ---------------------------------------------------------------------------
PG_DUMP=${PG_DUMP:-pg_dump}
TMP=$(mktemp -d); trap 'rm -rf "$TMP"; for d in "${DBS[@]}"; do dropdb --if-exists "$d"; done' EXIT
expect_fail() { # $1=db $2=file $3=label : the file must abort, and leave the database unchanged
  if run "$1" "$2" >"$TMP/out" 2>&1; then echo "FAIL $3 (it ran)"; exit 1; fi
  grep -q "precondition failed" "$TMP/out" || { cat "$TMP/out"; echo "FAIL $3 (wrong error)"; exit 1; }
  echo "  PASS $3"
}
baseline_clone() { # $1=db : baseline migrations + audited live drift + sample data
  createdb "$1"; DBS+=("$1")
  run "$1" supabase/tests/00_local_supabase_stub.sql
  for f in supabase/migrations/*.sql; do [ "$(version "$f")" -le "$BASELINE_MAX" ] && run "$1" "$f"; done
  run "$1" supabase/tests/fixtures/live_drift_2026-11-18.sql
  run "$1" supabase/tests/fixtures/sample_data.sql
}
echo "== [release rehearsal] backup verification, guarded STEP A/B, rollback and roll forward"
scripts/build-release-sql.sh >/dev/null
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git diff --quiet -- supabase/release || { echo "FAIL supabase/release is out of date; run scripts/build-release-sql.sh"; git --no-pager diff --stat -- supabase/release; exit 1; }
  echo "  PASS release files match the migrations (regenerated, no difference)"
else
  echo "  (not a git checkout: release-file freshness check skipped; CI runs it)"
fi

db="akh_test_$$_rel"; baseline_clone "$db"
psql -X -At -d "$db" -f supabase/backup/fingerprint.sql > "$TMP/expected.txt"
"$PG_DUMP" --data-only --schema=public --format=custom -d "$db" -f "$TMP/backup.dump"
scripts/verify-backup.sh "$TMP/backup.dump" "$TMP/expected.txt" | sed -n 's/^BACKUP VERIFIED.*/  PASS backup: data-only dump restored into a scratch database matches the live fingerprint/p'
sed '1s/:[0-9a-f]*$/:0000/' "$TMP/expected.txt" > "$TMP/tampered.txt"
if scripts/verify-backup.sh "$TMP/backup.dump" "$TMP/tampered.txt" >/dev/null 2>&1; then echo "FAIL backup verification accepted a mismatching fingerprint"; exit 1; fi
echo "  PASS backup: verification rejects a backup that does not match"

pre="akh_test_$$_pre"; baseline_clone "$pre"
expect_fail "$pre" supabase/release/step_b_apply.sql "STEP B refuses to run before STEP A"
psql -X -q -d "$pre" -c "update public.conference_settings set demo_mode = false where id = 1"
expect_fail "$pre" supabase/release/step_a_apply.sql "STEP A refuses to run unless demo_mode = true"
psql -X -At -d "$pre" -c "select has_table_privilege('anon','public.registrations','TRUNCATE')" | grep -qx t \
  && echo "  PASS aborted steps changed nothing (live grants still as before)"

run "$db" supabase/release/step_a_apply.sql 2>&1 | sed -n 's/^.*NOTICE:  \(STEP A verified.*\)$/  PASS \1/p'
run "$db" supabase/release/step_b_apply.sql 2>&1 | sed -n 's/^.*NOTICE:  \(STEP B verified.*\)$/  PASS \1/p'
run "$db" supabase/tests/30_release_rollback.sql 2>&1 | report
echo "ALL DATABASE SUITES PASSED (fresh, live-clone and release rehearsal)"
