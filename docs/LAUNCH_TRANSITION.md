# From pre-launch testing to official registration

The website is the commissioned conference site. **Opening official registration is a separate decision** that needs its own approval. This runbook moves the participant system from pre-launch test records to official records. It never deletes data unless you choose Option B and give written authorisation.

## How the switch works

Everything is controlled by one database row, `public.conference_settings` (id = 1). The website reads the same row that the database security rules enforce.

| Setting | Who changes it | Effect |
|---|---|---|
| `registration_open`, `submissions_open` | Organisers, in **Organiser control centre → Launch controls** | Opens or closes the public forms; enforced by the database too |
| `registration_deadline`, `abstract_deadline` | Organisers, in Launch controls (WAT) | After the deadline, the forms close automatically; enforced by the database too |
| `demo_mode` | **Database administrator only**, using this runbook | `true`: new records are test records (`DEMO-` references). `false`: official records |

`demo_mode` can never be changed from the browser or the settings API. This is covered by the tests.

## Decisions the LOC must record before switching

1. **Retention of test records.** Choose one:
   - **Option A: keep and segregate (recommended, non-destructive).** All test records stay, flagged `is_demo`, visible only to organisers and excluded from the public abstract book. People who tested can register again officially. File: `supabase/pending/02_option_a_retain_and_segregate.sql`.
   - **Option B: archive, then delete.** Copies test records into a private `archive` schema, then deletes them from the live tables. **Destructive.** It requires the project owner's written authorisation. The script refuses to run unless the operator sets an explicit confirmation. File: `supabase/pending/03_option_b_archive_then_delete.sql`. Test attachments are listed for manual removal after the archive has been verified.
2. **Reference numbering.** Official references continue from the current serial numbers (e.g. the first official registration might be `AKH-2027-0013`), and numbers can skip. Confirm that this is acceptable, or ask for a separate official numbering sequence before launch.
3. **Test accounts.** Sign-in accounts created during testing remain. Decide whether to keep them (recommended: they belong to real people who may register officially) or remove specific ones on request.
4. **Privacy notice.** The LOC, and FUTA's data-protection contact, approve `/privacy`, including the retention period.
5. **Deadlines** for registration and abstracts.

## Deploying this release (before any launch decision)

The live audit of 2026-11-18 (`docs/audit/`) is reproduced in CI by `supabase/tests/fixtures/live_drift_2026-11-18.sql`. Every suite runs against both a fresh database and that live-like clone.

| Order | Migration | Compatible with app currently live? | Compatible with this PR's app? |
|---|---|---|---|
| 1 | `20261117000100` reconcile live functions (no-op on live) | Yes | Yes |
| 2 | `20261117000200` grant/revoke functions, deadline gates, audit columns | Yes | Required |
| 3 | `20261118000100` blind review and revocation | **No**: old reviewer page loses abstract text | Required |
| 4 | `20261118000200` least-privilege grants, drop direct role-write policies | **No**: old organiser panel's reviewer grant stops working | Required |

1. **Re-run the read-only drift check** (`supabase/pending/00_live_drift_check.sql`) and confirm that the live state still matches the audit. In particular, compare the exact text of the two `user_roles` write policies. The fixture reconstructs them from the audit description.
2. **Backup** (and verify that it restores).
3. **Staging:** restore the backup to staging, apply 1 → 4, deploy this PR's build to staging, and run the smoke test below.
4. **Production, step A (any time):** apply 1 and 2, each in a transaction. The live app keeps working.
5. **Production, step B (short maintenance window, minutes):** apply 3 and 4 in one transaction, then immediately promote the already-built deployment of this PR. Between the two, reviewer pages and reviewer grants are briefly unavailable; registration and submission are unaffected.
6. **Smoke test:**
   - Launch controls show `demo_mode=true` and the live open/closed values.
   - A reviewer sees assignments without author names.
   - Granting and removing a reviewer works.
   - A participant gets 403 from the organiser APIs.
   - The drift check shows no TRUNCATE/DELETE grants to `anon`/`authenticated` and no UPDATE on `demo_mode`.

Use the SQL editor rather than `supabase db push` unless the live migration history already lists every earlier file.

## Procedure for the official switch

1. **Backup.** Take a Supabase backup (or `pg_dump`) and confirm that it restores.
2. **Read-only report.** Run `supabase/pending/01_preflight_report.sql` and attach the output to the approval record.
3. **Staging rehearsal.** Restore the backup to a staging project, run the chosen option there, and complete the checklist below.
4. **Production switch.** Run the chosen option in the SQL editor. Both gates are left **closed**.
5. **Post-switch smoke test** while closed: confirm `/register` says "Registration is not open yet".
6. **Open.** An organiser opens registration and, when announced, abstract submission from Launch controls.

## End-to-end checklist (staging, then production)

- [ ] Sign in by email link; an expired or reused link shows a clear message.
- [ ] Register; the confirmation email arrives with an `AKH-2027-` reference (no `DEMO-`).
- [ ] Revisiting `/register` shows the registration summary; a second registration is refused.
- [ ] Submit a 250–300-word abstract with a PDF; the email arrives; the portal shows "Submitted".
- [ ] Organiser grants a reviewer (the reviewer must have signed in once), assigns the abstract, and the reviewer saves a review.
- [ ] The reviewer cannot see author names, other abstracts or registrations.
- [ ] Organiser records a decision; the author is emailed; publish works only for an accepted, official abstract.
- [ ] Closing registration in Launch controls closes `/register` immediately; a past deadline closes it automatically.
- [ ] Participants get 403 from every organiser API and cannot change launch settings.
- [ ] CSV exports open correctly and include the `is_demo` column.

The automated equivalents run with `scripts/test-db.sh`, locally and in CI: the database security boundaries plus a full Option A transition test (`supabase/tests/20_option_a_transition.sql`).
