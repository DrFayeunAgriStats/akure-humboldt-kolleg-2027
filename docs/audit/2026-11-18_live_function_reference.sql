-- LIVE, READ-ONLY FUNCTION REFERENCE: Akure Humboldt Kolleg 2027
-- Retrieved 2026-11-18 from project vfihhakkeoaskfumgsbw using pg_get_functiondef().
-- This file is EVIDENCE FOR CODE REVIEW, NOT A PRODUCTION MIGRATION.
-- DO NOT EXECUTE this snapshot; compare the bodies and the exact ACLs instead.
-- Both functions ACL: {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
-- Both: security_definer true, search_path='', anon EXECUTE=false, authenticated EXECUTE=true.

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
