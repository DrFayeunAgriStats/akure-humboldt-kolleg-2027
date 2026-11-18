# Production acceptance checklist: PR #6

No separate staging environment is used (board decision, 18 November 2026). These checks run against the existing Supabase project and Vercel deployment, **after** the release is authorised. They use AFDS test accounts only, with `demo_mode = true` and official registration closed. The step-by-step procedure, backup verification and rollback are in `docs/PRODUCTION_INTEGRATION.md`.

Record pass/fail, the date, initials and evidence (screenshot, SQL output or HTTP status) for each item.

## A. Authorisations and prerequisites

| # | Item | Evidence |
|---|---|---|
| A1 | Project owner authorises the release (`docs/PRODUCTION_INTEGRATION.md` section 7) | Written approval |
| A2 | PR #6 head commit recorded; GitHub Actions green (verify + database jobs, including the release rehearsal) | Run URL |
| A3 | Backup verified: **BACKUP VERIFIED** from `scripts/verify-backup.sh`; attachment count matches (runbook section 2) | Output, file names |
| A4 | Supabase Auth Site URL and redirect URL set to the production domain (runbook 3.1–3.2) | Screenshot |
| A5 | Vercel production environment variables set; obsolete flags removed; preview access limited (runbook 4.1–4.3) | Screenshot |
| A6 | Four test accounts available (organiser, reviewer, participant A, participant B) | Account list (no passwords) |

## B. Database: before the release (read-only)

| # | Check | Expected |
|---|---|---|
| B1 | Run `supabase/pending/00_live_drift_check.sql` on the live project | Matches the 2026-11-18 audit: the two extra `user_roles` policies; broad grants; `demo_mode=true`; global default EXECUTE to `authenticated` |
| B2 | Run `supabase/pending/01_preflight_report.sql` | Record test and official counts (official = 0) |
| B3 | `select pg_get_functiondef('public.find_conference_account(text)'::regprocedure)` | Identical to `docs/audit/2026-11-18_live_function_reference.sql` |

## C. Database: release steps and checks

| # | Step | Expected |
|---|---|---|
| C1 | Run `supabase/release/step_a_apply.sql` | Notice **STEP A verified**; the two live functions are unchanged (re-run B3) |
| C2 | Check the currently deployed app after STEP A (sign-in, register page, organiser page) | Still works |
| C3 | After the new deployment is Ready, run `supabase/release/step_b_apply.sql` | Notice **STEP B verified** |
| C4 | Re-run `00_live_drift_check.sql` | No TRUNCATE/REFERENCES/TRIGGER for `anon`/`authenticated` on conference tables; no UPDATE on `conference_settings.demo_mode`; no INSERT/DELETE/UPDATE policies on `user_roles`; abstracts read policy has no reviewer branch; Storage policies and grants unchanged from B1 (Supabase-managed; not modified) |
| C5 | `select has_column_privilege('authenticated','public.conference_settings','demo_mode','UPDATE')` | `false` |
| C6 | Functions in `public` executable by **anon** (exact signatures): `select format('%s.%s(%s)', n.nspname, p.proname, oidvectortypes(p.proargtypes)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and has_function_privilege('anon',p.oid,'EXECUTE') and not exists (select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e') order by 1` | No rows |
| C7 | Same query for **authenticated** | Exactly these five lines, no more and no fewer:<br>`public.conference_reviewer_assignments()`<br>`public.conference_reviewer_directory()`<br>`public.find_conference_account(text)`<br>`public.grant_conference_reviewer(text)`<br>`public.revoke_conference_reviewer(uuid)`<br>Any other signature, **including an overload of one of these names** (e.g. `find_conference_account(text, integer)`), is a failure. |
| C7a | Each approved signature: `select s, has_function_privilege('authenticated', s::regprocedure, 'EXECUTE') as authenticated, has_function_privilege('anon', s::regprocedure, 'EXECUTE') as anon from unnest(array['public.conference_reviewer_assignments()','public.conference_reviewer_directory()','public.find_conference_account(text)','public.grant_conference_reviewer(text)','public.revoke_conference_reviewer(uuid)']) s` | 5 rows, each `authenticated = true`, `anon = false`; the cast succeeds, so every signature exists |
| C7b | Overloads of approved names: `select format('%s(%s)', proname, oidvectortypes(proargtypes)) from pg_proc where pronamespace='public'::regnamespace and proname in ('conference_reviewer_assignments','conference_reviewer_directory','find_conference_account','grant_conference_reviewer','revoke_conference_reviewer') order by 1` | Exactly the five signatures above (no extra overloads exist) |
| C8 | Row counts from B2 unchanged | Identical |
| C9 | `select demo_mode, registration_open, submissions_open from public.conference_settings` | Unchanged from B1 (still test mode) |

## D. Application: production deployment of PR #6

| # | Check | Expected |
|---|---|---|
| D1 | Production site loads; no console errors on `/`, `/register`, `/submit`, `/programme`, `/login`, `/dashboard` | Pass |
| D2 | Launch controls (organiser) show the values from C9, including `demo_mode` (test mode) | Match |

## E. Functional acceptance by role (test accounts)

**Participant**

| # | Check | Expected |
|---|---|---|
| E1 | Request a sign-in link; open it in the same browser | Arrives at the page the user started from |
| E2 | Open an expired or used link | Clear "expired or already used" message on `/login` |
| E3 | Register | Reference `DEMO-AKH-2027-…`; confirmation email; revisiting `/register` shows the summary |
| E4 | Submit a 250–300-word abstract with a valid PDF | Reference `DEMO-AKH-ABS-…`; email; portal shows "Submitted" |
| E5 | Submit with a file renamed to `.pdf` that isn't a PDF | Refused with a clear message |

**Organiser**

| # | Check | Expected |
|---|---|---|
| E6 | Grant a reviewer by email (reviewer has signed in once) | Listed; `user_roles.granted_by` set |
| E7 | Grant self; grant an unknown email; grant an existing reviewer | Each refused with its own clear message |
| E8 | Assign the reviewer to the abstract | Status "Under review"; assignment email (if email is configured) |
| E9 | Close registration in Launch controls; check `/register` as a participant | "Registration is not open yet"; API returns 403 |
| E10 | Set a past registration deadline; reopen with no deadline | Closed publicly; reopened |
| E11 | Record accept/reject after a review exists; try to publish a DEMO abstract | Decision saved; publishing refused |
| E12 | Manage a session and a speaker (create, publish, unpublish) | Public pages update |
| E13 | Download both CSV exports | Open correctly; `is_demo` column present |

**Reviewer**

| # | Check | Expected |
|---|---|---|
| E14 | Open the workspace | Assigned abstract shown; **no author name, email or institution** |
| E15 | Open the attachment link | Opens (temporary link) |
| E16 | Save, then edit, a review | Both succeed |
| E17 | Organiser removes reviewer access; reviewer reloads | "Restricted reviewer area"; attachment link refused |

## F. Security probes against production (REST, using the publishable key and test-account tokens)

Expected results are shown; any successful data access is a failure.

| # | Request | Expected |
|---|---|---|
| F1 | `GET /rest/v1/registrations` with anon key only | 401/permission denied, no rows |
| F2 | `POST /rest/v1/rpc/find_conference_account` with anon key | Refused (no EXECUTE) |
| F3 | As a participant token: `GET /rest/v1/abstracts?select=author_name,email` | Own abstracts only |
| F4 | As a reviewer token: `GET /rest/v1/abstracts?select=author_name,email` | No rows |
| F5 | As an organiser token: `PATCH /rest/v1/conference_settings?id=eq.1` body `{"demo_mode":false}` | Permission denied; `demo_mode` unchanged |
| F6 | As an organiser token: `POST /rest/v1/user_roles` body `{"user_id":"…","role":"reviewer"}` | Permission denied |
| F7 | As an organiser token: `PATCH /rest/v1/abstracts?id=eq.…` body `{"is_demo":false}` | Permission denied |
| F8 | Cross-site `POST /api/register` with `Origin: https://example.org` | 403 |
| F9 | Supabase Security Advisor (compare with the export from pre-flight) | No new warnings for public SECURITY DEFINER functions or exposed tables; review any remaining ones |

## G. Mobile, accessibility and content

| # | Check | Expected |
|---|---|---|
| G1 | Phone (390 px), tablet (820 px), desktop (1440 px) on the pages in D1 | No horizontal scroll; menu opens and closes (Escape too) |
| G2 | Keyboard only: skip link, menu, forms, tables | All reachable, with visible focus |
| G3 | axe scan of the D1 pages | 0 violations |
| G4 | LOC confirms public wording ("proposed" removed) and approves `/privacy` | Written confirmation |

## H. Rollback readiness

| # | Check | Expected |
|---|---|---|
| H1 | CI release rehearsal passed for the released commit (STEP A/B, rollback, roll forward, backup verification) | Run URL |
| H2 | Previous Vercel production deployment ID recorded; Instant Rollback available | Deployment ID |
| H3 | `supabase/release/step_b_rollback_app_compat.sql` at hand; rule agreed: roll back with Vercel and this script, or restore from backup. Never re-grant the removed privileges | Owner note |

## I. Sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| AFDS technical lead | | | |
| AFDS Advisory Board | | | |
| Project owner | | Accept the release | |

Opening official registration (Option A, `supabase/pending/02_option_a_retain_and_segregate.sql`) is a **separate** authorisation after production acceptance.
