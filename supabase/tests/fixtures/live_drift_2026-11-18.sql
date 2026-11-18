-- LIVE-DRIFT FIXTURE (LOCAL TESTING ONLY). Applied after the repository baseline
-- migrations (up to 20261114000200) to reproduce the live database as audited on
-- 2026-11-18 (docs/audit/2026-11-18_live_database_drift_findings.md), so the
-- corrective migrations are tested against the state they will meet in production.

-- 1. The two hand-made live functions, verbatim (docs/audit/2026-11-18_live_function_reference.sql),
--    with the live ACL {postgres, authenticated, service_role}.
CREATE OR REPLACE FUNCTION public.conference_reviewer_directory()
 RETURNS TABLE(user_id uuid, user_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not private.has_role('organiser') then
  raise exception 'Organiser access required';
 end if;
 return query select u.id,u.email::text
 from auth.users u join public.user_roles ur on ur.user_id=u.id
 where ur.role='reviewer' order by lower(u.email);
end
$function$;

CREATE OR REPLACE FUNCTION public.find_conference_account(p_email text)
 RETURNS TABLE(user_id uuid, user_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not private.has_role('organiser') then
    raise exception 'Organiser access required';
  end if;
  if p_email is null or length(trim(p_email)) < 5 or length(p_email)>255 then
    raise exception 'Invalid email';
  end if;
  return query select u.id, u.email::text from auth.users u
  where lower(u.email) = lower(trim(p_email)) limit 1;
end;
$function$;
revoke all on function public.conference_reviewer_directory(), public.find_conference_account(text) from public, anon;
grant execute on function public.conference_reviewer_directory(), public.find_conference_account(text) to authenticated, service_role;

-- 2. Extra live user_roles policies. The audit describes their conditions; their
--    exact SQL text was not exported, so they are reconstructed from that description:
--    INSERT checks role='reviewer', user_id <> auth.uid() and the organiser role;
--    DELETE checks role='reviewer' and the organiser role.
create policy roles_organiser_add_reviewer on public.user_roles for insert to authenticated
with check (role = 'reviewer' and user_id <> (select auth.uid()) and private.has_role('organiser'));
create policy roles_organiser_remove_reviewer on public.user_roles for delete to authenticated
using (role = 'reviewer' and private.has_role('organiser'));

-- 3. Broad live table privileges: anon=arwdDxt(m) and authenticated=arwdDxt(m) on the
--    conference tables; user_roles has authenticated=ardDxt(m) (no UPDATE).
grant all on table public.registrations, public.abstracts, public.review_assignments, public.reviews,
  public.speakers, public.sessions, public.public_abstracts, public.conference_settings
  to anon, authenticated;
grant all on table public.user_roles to anon;
grant all on table public.user_roles to authenticated;
revoke update on table public.user_roles from authenticated;

-- 4. Live default privileges: in addition to Supabase's schema-level defaults (in the
--    local stub), the live project has a GLOBAL default EXECUTE grant to authenticated
--    (advisory-board read-only check, 2026-11-18). Combined with PostgreSQL's built-in
--    EXECUTE-to-PUBLIC default, schema-level REVOKEs cannot make new functions private.
alter default privileges grant execute on functions to authenticated;
