#!/usr/bin/env bash
# Verifies a logical backup of the conference data by restoring it into a throwaway
# local database and comparing its fingerprint with the one taken from live.
#
#   scripts/verify-backup.sh <public-data.dump> <expected-fingerprint.txt>
#
# <public-data.dump>  pg_dump --data-only --schema=public --format=custom of the live DB
# <expected...txt>    output of supabase/backup/fingerprint.sql run on live at backup time
#                     (psql -At -f supabase/backup/fingerprint.sql > expected.txt)
# Env: VERIFY_SCHEMA_AT = last migration version the live schema had when the backup
#      was taken (default 20261114000200, i.e. before this release).
#      PG_RESTORE / PG* select the local tools and server. Never connects to Supabase.
set -euo pipefail
cd "$(dirname "$0")/.."
DUMP=$1; EXPECTED=$2
AT=${VERIFY_SCHEMA_AT:-20261114000200}
PG_RESTORE=${PG_RESTORE:-pg_restore}
DB="akh_verify_$$"
export PGOPTIONS="-c client_min_messages=warning"
run() { psql -X -q -t -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
createdb "$DB"; trap 'dropdb --if-exists "$DB"' EXIT
run -f supabase/tests/00_local_supabase_stub.sql
for f in supabase/migrations/*.sql; do
  [ "$(basename "$f" | cut -d_ -f1)" -le "$AT" ] && run -f "$f"
done
# Empty the tables the schema migrations seeded, then load the backup's rows.
run -c "truncate public.reviews, public.review_assignments, public.public_abstracts, public.abstracts, public.registrations,
        public.user_roles, public.speakers, public.sessions, public.conference_settings restart identity cascade"
"$PG_RESTORE" --data-only --disable-triggers --no-owner --no-privileges -d "$DB" "$DUMP"
ACTUAL=$(psql -X -At -d "$DB" -f supabase/backup/fingerprint.sql)
if [ "$ACTUAL" = "$(cat "$EXPECTED")" ]; then
  echo "BACKUP VERIFIED: restored copy matches the live fingerprint"
  echo "$ACTUAL" | sed 's/^/  /'
else
  echo "BACKUP VERIFICATION FAILED: restored copy differs from the live fingerprint" >&2
  diff <(cat "$EXPECTED") <(echo "$ACTUAL") >&2 || true
  exit 1
fi
