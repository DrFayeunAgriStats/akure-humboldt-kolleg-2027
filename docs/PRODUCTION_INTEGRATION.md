# Production integration runbook: PR #6

**Board decision (18 November 2026):** the website is still under development, has no active users and has not opened official registration, so no separate staging environment is used. PR #6 is integrated directly into the existing Supabase project and Vercel deployment.

**Fixed throughout:** `demo_mode = true`; official registration stays closed; no records are deleted; Supabase-managed schemas (`auth`, `storage`, `extensions`, …) are not changed.

Every database step below is a single guarded transaction that was rehearsed in CI on a live-like clone (`scripts/test-db.sh`, release rehearsal). Each step checks its preconditions and its result, and rolls back on any unexpected condition.

Steps marked **Owner** need project credentials or dashboard access, which AFDS does not hold in this repository. Never paste database passwords or keys into chat, issues or commits.

---

## 1. Pre-flight (read-only, no approval needed)

| # | Who | Step | Pass criterion |
|---|---|---|---|
| 1.1 | Owner | Run `supabase/pending/00_live_drift_check.sql` in the SQL editor; send the output for review | Matches the 18 November audit: the two `user_roles` write policies, broad grants, the two organiser functions, `demo_mode=true`. Section 7 (default privileges) is reviewed |
| 1.2 | Owner | `select demo_mode, registration_open, submissions_open from public.conference_settings` | `demo_mode = true`; values recorded |
| 1.3 | Owner | Supabase Dashboard → Security Advisor: export current warnings | Saved for before/after comparison |
| 1.4 | Owner | Supabase Dashboard → Database → Backups: note the plan's automatic backups or PITR, and the newest restore point | Recorded (the plan determines what exists; section 2 does not rely on it) |

## 2. Backup and recovery verification (before any change)

A backup is only proven by restoring it. No staging project is needed: the logical backup is restored into a throwaway local PostgreSQL database and compared with a fingerprint taken from live.

| # | Who | Step | Pass criterion |
|---|---|---|---|
| 2.1 | Owner/AFDS | Full logical backup (keep securely; contains personal data):<br>`pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --file=akh-full-YYYYMMDD.dump` | File written; `pg_restore --list` lists the public tables |
| 2.2 | Owner/AFDS | Conference-data backup:<br>`pg_dump "$SUPABASE_DB_URL" --data-only --schema=public --format=custom --file=akh-public-data-YYYYMMDD.dump` | File written |
| 2.3 | Owner | Immediately afterwards, fingerprint live (read-only):<br>`psql "$SUPABASE_DB_URL" -At -f supabase/backup/fingerprint.sql > akh-fingerprint-YYYYMMDD.txt` | Nine lines: `table:count:hash` |
| 2.4 | AFDS | Verify on a local PostgreSQL (no Supabase access needed):<br>`scripts/verify-backup.sh akh-public-data-YYYYMMDD.dump akh-fingerprint-YYYYMMDD.txt` | Prints **BACKUP VERIFIED** |
| 2.5 | Owner | Attachments are Storage files, not database rows: download the `abstract-files` bucket (Dashboard, or `supabase storage cp -r ss:///abstract-files ./akh-abstract-files --experimental`) and compare with `select count(*) from storage.objects where bucket_id = 'abstract-files'` | File count equals the row count |

`$SUPABASE_DB_URL` is the project's Postgres connection string (Dashboard → Connect), held by the owner. If there were writes between 2.2 and 2.3, repeat both. The project has no users, so this is not expected.

## 3. Supabase project configuration (Owner, no schema change)

| # | Setting | Value |
|---|---|---|
| 3.1 | Auth → URL configuration → Site URL | The production domain, e.g. `https://akure-humboldt-kolleg-2027.vercel.app` (or the final domain) |
| 3.2 | Auth → Redirect URLs | `https://<production-domain>/auth/callback`. Do **not** add wildcard preview URLs: previews also use this live project |
| 3.3 | Auth → Email | Sender and rate limits adequate for test accounts; magic-link template mentions the conference |
| 3.4 | API → Exposed schemas | Unchanged (Supabase default). The release does not depend on other schemas |
| 3.5 | Test accounts | Four AFDS-controlled mailboxes: organiser, reviewer, participant A, participant B. The organiser role is granted once by the owner in the SQL editor (`insert into public.user_roles(user_id, role) …`); reviewers are granted from the dashboard after deployment |

## 4. Vercel configuration (Owner)

| # | Setting | Value |
|---|---|---|
| 4.1 | Production environment variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable key only), `NEXT_PUBLIC_SITE_URL=<production URL>`, `SITE_PUBLIC=false` (no indexing until the LOC approves). Optional email: `RESEND_API_KEY`, `CONFERENCE_FROM_EMAIL`, `ORGANISER_NOTIFICATION_EMAIL` |
| 4.2 | Remove obsolete variables | `REGISTRATION_OPEN`, `SUBMISSIONS_OPEN` (now ignored; control is in the database). No Supabase secret or service-role key is needed |
| 4.3 | Preview deployments | Previews connect to the same live project. Limit preview access (Vercel deployment protection) and do not share preview links |
| 4.4 | Rollback readiness | Note the current production deployment ID; confirm Instant Rollback is available to the owner's team |

## 5. Release sequence (only after written approval)

| # | When | Action | Expected |
|---|---|---|---|
| 5.1 | Any time after section 2 passes | Run `supabase/release/step_a_apply.sql` (SQL editor: paste the whole file; or `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f …`) | Notice **STEP A verified**; the currently deployed app keeps working |
| 5.2 | Start of a short window | Merge PR #6 to `main`. Vercel builds the production deployment | Deployment **Ready**. Until 5.3 only the reviewer workspace is unavailable; there are no users |
| 5.3 | Immediately after 5.2 is Ready | Run `supabase/release/step_b_apply.sql` | Notice **STEP B verified** |
| 5.4 | Immediately | Read-only checks C5–C9 in `docs/PRODUCTION_ACCEPTANCE.md`; Security Advisor again | As listed; no new advisor warnings |
| 5.5 | Next | End-to-end acceptance with the test accounts (`docs/PRODUCTION_ACCEPTANCE.md`, sections D–G) | All pass |

Both release files refuse to run unless `demo_mode = true`, and STEP B refuses to run before STEP A. Each one also aborts if launch settings or row counts would change. All of this is rehearsed in CI.

## 6. Rollback procedure

| Situation | Action | Data impact |
|---|---|---|
| Problem after 5.1 only | Nothing to undo for the app (STEP A is additive and compatible). If needed, leave it in place and investigate | None |
| App problem after 5.2/5.3 | 1. Vercel → Instant Rollback to the deployment noted in 4.4. 2. Run `supabase/release/step_b_rollback_app_compat.sql`. It restores exactly what the previous app needs (reviewer read path; organiser role writes) and **does not** restore TRUNCATE, table-wide UPDATE, `demo_mode` updates or anon access | None (checked inside the script) |
| Roll forward after a rollback | Re-deploy the new build, then re-run `step_b_apply.sql` (idempotent; re-verifies) | None |
| Data damaged (last resort; requires owner authorisation) | Restore from the backups taken in section 2: Supabase restore point, or truncate the conference tables and `pg_restore --data-only --disable-triggers` the dump from 2.2, then fingerprint-compare | Loses changes made after the backup (none expected pre-launch) |

The rollback and roll-forward are rehearsed in CI (`supabase/tests/30_release_rollback.sql`).

## 7. Approvals

| Approval | By | Date |
|---|---|---|
| Section 2 passed (backup verified), section 3–4 configuration done | Owner / AFDS | |
| Authorise release sequence 5.1–5.5 | Project owner | |
| Authorise merge of PR #6 (5.2) | Project owner | |
| Opening official registration (Option A) | **Separate, later authorisation** | |
