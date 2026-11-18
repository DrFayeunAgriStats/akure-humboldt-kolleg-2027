# LIVE conference Supabase drift findings — 18 November 2026

**Read-only audit evidence for draft PR #6; no production writes performed.**
Source: dedicated conference Supabase project `vfihhakkeoaskfumgsbw`.
This is a summary of the live database, not a proposed migration.

## Critical differences from the local/test schema

1. **`public.abstracts` currently leaks author identity to assigned reviewers.**
   The existing `abstract_owner_admin_reviewer_read` SELECT policy includes
   `exists(select 1 from public.review_assignments ra where ra.abstract_id=abstracts.id and ra.reviewer_id=auth.uid())`
   without checking that the requester still has the reviewer role.
   Because RLS controls rows, not individual columns, it grants the complete abstract row, including author email and name.
   PR migration `20261118000100_blind_review_and_reviewer_revocation.sql` is necessary.

2. **Extra policies exist in the live `public.user_roles` table:**
   - `roles_organiser_add_reviewer` (INSERT; checks `role='reviewer'`, `user_id <> auth.uid()`, and organiser role)
   - `roles_organiser_remove_reviewer` (DELETE; checks `role='reviewer'` and organiser role)
   They are absent from the repo baseline. **They permit direct organiser reviewer-role writes on the live database** because effective privileges include INSERT and DELETE for `authenticated`. The new PR's claim that every client is blocked from direct role writes is **not true of the current live configuration**. Address with an explicit reviewed migration; do not assume local tests cover the live policies.

3. **Unexpected broad live table grants.**
   The actual `pg_class.relacl` for the conference tables includes `anon=arwdDxtm` and `authenticated=arwdDxtm` for several sensitive tables, including `conference_settings`, `abstracts`, `registrations`, `reviews`, and `review_assignments`; `public.user_roles` has `anon=arwdDxtm` and `authenticated=ardDxtm`.
   `has_table_privilege()` confirms grants for INSERT, DELETE and TRUNCATE to both roles on these tables.
   RLS constrains ordinary row operations but **does not apply to TRUNCATE**. Do not assume all these grants are harmless merely because there is no ordinary HTTP endpoint for every SQL operation.
   Recommend least-privilege GRANT/REVOKE reconciliation in a separately tested migration.

4. **`conference_settings.demo_mode` is effectively updateable by organisers through the current live client role.**
   `has_column_privilege('authenticated','public.conference_settings','demo_mode','UPDATE')` = **true**, and there is an organiser-only `conference_settings_admin_update` RLS policy. Table-level UPDATE is granted, which defeats the intended column-only restrictions in the older migration.
   PR #6 intends `demo_mode` to require DB administrator approval, but that is **not enforced by the current live privilege setup**.
   Revoke table-wide UPDATE from `anon` and `authenticated`, grant only intended columns to `authenticated`, and verify with role-based tests against a clone of **live** grants.

5. **Blind review and reviewer revocation must be evaluated together** with every remaining RLS policy and storage policy. The live `storage.objects.abstract_files_assigned_reviewer_read` policy already checks `private.has_role('reviewer')`, but abstract SELECT does not. Review the PR's new helper/RPC privileges for all roles.

## Verified positives

- All **nine** public conference tables have row-level security enabled.
- The two live organiser lookup functions exist and are organiser-gated, have `SECURITY DEFINER` with `search_path=''`, and are not executable by `anon`.
- Both exact live function definitions and effective function ACLs are in `docs/audit/2026-11-18_live_function_reference.sql`.
- The extra `user_roles` policies restrict direct operations to reviewer-role changes (not organiser grants). Still contrary to the proposed server-only control.
- Live launch settings at audit: `demo_mode=true`, `registration_open=true`, `submissions_open=true`.
- No schema or data was modified by this audit.

## Required before merging/deploying PR #6

- Reconcile the two function bodies with the exact live reference file. Preserve organiser checks and input validation.
- Add migrations that explicitly reconcile the extra live `user_roles` policies and broad table/column grants, **without weakening legitimate participant and reviewer workflows**.
- Ensure `demo_mode` cannot be updated through the public API, even by an organiser; retain the administrator-only launch transition.
- Re-run the local security suite against a staging clone with the **live** ACLs and policies or explicitly seed the drift into a test fixture.
- Review Supabase security-advisor warnings for public `SECURITY DEFINER` functions, and validate lack of unwanted `anon` invocation.
- Apply changes to staging before production and obtain the project owner's authorisation.

**Note:** This report describes effective PostgreSQL privileges and policies. It does not claim a successful unauthenticated external HTTP exploit was demonstrated. It identifies security boundaries that need correction and verification.
