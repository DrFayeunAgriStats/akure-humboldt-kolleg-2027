-- Least-privilege reconciliation with the live database (audit of 2026-11-18,
-- docs/audit/2026-11-18_live_database_drift_findings.md).
--
-- Live findings addressed:
--   1. anon and authenticated hold ALL table privileges (incl. TRUNCATE, which
--      RLS does not govern) on the conference tables.
--   2. Table-wide UPDATE on conference_settings lets organisers change demo_mode
--      through the API, defeating the intended column-only grant.
--   3. Extra user_roles policies (roles_organiser_add_reviewer /
--      roles_organiser_remove_reviewer) allow direct organiser role writes,
--      bypassing the audited grant/revoke functions.
--
-- Approach: revoke everything from the client roles on the nine conference
-- tables, then grant back exactly what the application's workflows use. RLS
-- policies stay the row-level gate; these grants are the column/operation gate.
-- No rows are changed. service_role and postgres are not touched.
-- Idempotent: safe to re-run.

------------------------------------------------------------------------------
-- 1. Reset client-role table privileges on the conference tables
------------------------------------------------------------------------------
revoke all on table
  public.user_roles, public.registrations, public.abstracts, public.review_assignments,
  public.reviews, public.speakers, public.sessions, public.public_abstracts, public.conference_settings
from anon, authenticated;

------------------------------------------------------------------------------
-- 2. Grant back exactly what each workflow needs
------------------------------------------------------------------------------
-- Public website (signed out): published programme, speakers, released
-- abstracts, and the launch state shown on the registration pages.
grant select on public.speakers, public.sessions, public.public_abstracts, public.conference_settings to anon;

-- Signed-in users. Comments name the workflow; RLS decides whose rows.
grant select on public.user_roles to authenticated;                         -- "am I staff?"; organisers list roles
grant select, insert on public.registrations to authenticated;              -- register; no edits after submission
grant select, insert on public.abstracts to authenticated;                  -- submit; read own (organisers read all)
grant update (status, is_published, decision_at)                            -- organiser decisions only; author text,
  on public.abstracts to authenticated;                                     -- email and is_demo stay immutable
grant select, insert, delete on public.review_assignments to authenticated; -- organiser assigns / unassigns
grant update (abstract_id, reviewer_id)                                     -- needed by the idempotent upsert
  on public.review_assignments to authenticated;                            -- (no UPDATE policy: rows never change)
grant select, insert on public.reviews to authenticated;                    -- reviewer saves a review
grant update (assignment_id, reviewer_id, relevance, rigour, clarity, impact, recommendation, comments, updated_at)
  on public.reviews to authenticated;                                       -- reviewer edits own review (upsert)
grant select, insert, update, delete on public.speakers, public.sessions to authenticated;  -- organiser content admin
grant select on public.public_abstracts to authenticated;
grant select on public.conference_settings to authenticated;
grant update (registration_open, submissions_open, registration_deadline, abstract_deadline, updated_at)
  on public.conference_settings to authenticated;                          -- Launch controls; NOT demo_mode

------------------------------------------------------------------------------
-- 3. Reviewer roles change only through the audited functions
------------------------------------------------------------------------------
drop policy if exists roles_organiser_add_reviewer on public.user_roles;
drop policy if exists roles_organiser_remove_reviewer on public.user_roles;
-- (user_roles now has SELECT only for clients, so even a re-created write
--  policy would have no effect without a fresh, reviewed GRANT.)

------------------------------------------------------------------------------
-- 4. SECURITY DEFINER functions: never executable by PUBLIC or anon
------------------------------------------------------------------------------
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon', f);
  end loop;
end $$;

------------------------------------------------------------------------------
-- 5. Future tables and functions created by the migration owner start closed
--    (Supabase's project defaults grant ALL to anon/authenticated, which is how
--    the broad live grants arose). New objects need explicit, reviewed grants.
------------------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;
