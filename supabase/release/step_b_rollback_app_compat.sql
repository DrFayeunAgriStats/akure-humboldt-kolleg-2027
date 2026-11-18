-- STEP B ROLLBACK (application-compatibility) — Akure Humboldt Kolleg 2027
-- Use ONLY if the new deployment must be rolled back to the previous Vercel
-- deployment after STEP B. Run it in the same window as the Vercel rollback.
--
-- What it restores (exactly what the PREVIOUS app needs):
--   * the reviewer branch of the abstracts read policy (old reviewer page reads
--     abstracts directly), with its original definition;
--   * the organiser reviewer-role INSERT/DELETE policies and the matching
--     INSERT/DELETE grants on user_roles (old organiser panel writes roles directly).
-- What it deliberately does NOT restore (never re-grant removed privileges):
--   TRUNCATE/REFERENCES/TRIGGER, table-wide UPDATE, client UPDATE on demo_mode,
--   anon access to non-public tables, EXECUTE for anon.
-- STEP A objects and the blind-review function are left in place (harmless to the old app).
-- Pure SQL, one transaction; any failed check rolls back. Idempotent.
begin;

create temporary table _rollback_pre on commit drop as
select s.demo_mode, s.registration_open, s.submissions_open,
       (select count(*) from public.registrations) as registrations,
       (select count(*) from public.abstracts) as abstracts,
       (select count(*) from public.user_roles) as user_roles
from public.conference_settings s where s.id = 1;

-- 1. Old reviewer read path (original definition from 20261113000100).
drop policy if exists abstract_owner_admin_reviewer_read on public.abstracts;
create policy abstract_owner_admin_reviewer_read on public.abstracts for select to authenticated
using (user_id = (select auth.uid()) or private.has_role('organiser')
  or exists (select 1 from public.review_assignments ra where ra.abstract_id = abstracts.id and ra.reviewer_id = (select auth.uid())));

-- 2. Old organiser reviewer-role writes (the live policies' conditions, per the 2026-11-18 audit).
drop policy if exists roles_organiser_add_reviewer on public.user_roles;
create policy roles_organiser_add_reviewer on public.user_roles for insert to authenticated
with check (role = 'reviewer' and user_id <> (select auth.uid()) and private.has_role('organiser'));
drop policy if exists roles_organiser_remove_reviewer on public.user_roles;
create policy roles_organiser_remove_reviewer on public.user_roles for delete to authenticated
using (role = 'reviewer' and private.has_role('organiser'));
grant insert, delete on public.user_roles to authenticated;

do $post$ declare p record; begin
  select * into p from _rollback_pre;
  if (select (demo_mode, registration_open, submissions_open) is distinct from (p.demo_mode, p.registration_open, p.submissions_open)
      from public.conference_settings where id = 1) then
    raise exception 'ROLLBACK check failed: launch settings changed';
  end if;
  if (select count(*) from public.registrations) <> p.registrations or (select count(*) from public.abstracts) <> p.abstracts
     or (select count(*) from public.user_roles) <> p.user_roles then
    raise exception 'ROLLBACK check failed: row counts changed';
  end if;
  if has_table_privilege('authenticated', 'public.registrations', 'TRUNCATE') or has_table_privilege('anon', 'public.registrations', 'TRUNCATE')
     or has_column_privilege('authenticated', 'public.conference_settings', 'demo_mode', 'UPDATE') then
    raise exception 'ROLLBACK check failed: a removed privilege reappeared';
  end if;
  raise notice 'STEP B rolled back for the previous app: reviewer read path and organiser role writes restored; removed privileges stay removed';
end $post$;
commit;
-- To roll forward again later: re-run step_b_apply.sql (it is idempotent and re-verifies).
