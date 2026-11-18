-- Reconcile two functions that exist in the live conference database but were
-- never committed to the repository:
--   public.find_conference_account(p_email text)   -> table(user_id uuid, user_email text)
--   public.conference_reviewer_directory()          -> table(user_id uuid, user_email text)
--
-- The bodies below are the EXACT live definitions retrieved with
-- pg_get_functiondef() on 2026-11-18 (docs/audit/2026-11-18_live_function_reference.sql),
-- including their organiser checks and input validation. The executable
-- privileges match the live ACL:
--   {postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres}
-- (no PUBLIC, no anon).
--
-- SAFETY: each function is created ONLY IF IT DOES NOT ALREADY EXIST.
--   * On the live project this migration is a no-op: the live functions, owners
--     and grants are left exactly as they are.
--   * On a fresh project (staging rebuild, CI, disaster recovery) it recreates
--     them identically.

do $migration$
begin
  if to_regprocedure('public.conference_reviewer_directory()') is null then
    execute $fn$
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
    $fn$;
    revoke all on function public.conference_reviewer_directory() from public, anon;
    grant execute on function public.conference_reviewer_directory() to authenticated, service_role;
  end if;

  if to_regprocedure('public.find_conference_account(text)') is null then
    execute $fn$
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
    $fn$;
    revoke all on function public.find_conference_account(text) from public, anon;
    grant execute on function public.find_conference_account(text) to authenticated, service_role;
  end if;
end
$migration$;
