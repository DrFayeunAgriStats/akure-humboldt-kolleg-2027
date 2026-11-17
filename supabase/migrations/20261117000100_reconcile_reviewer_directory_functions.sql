-- Reconcile two functions that exist in the live conference database but were
-- never committed to the repository:
--   public.find_conference_account(p_email text)   -> table(user_id uuid, user_email text)
--   public.conference_reviewer_directory()          -> table(user_id uuid, user_email text)
--
-- SAFETY: each function is created ONLY IF IT DOES NOT ALREADY EXIST.
--   * On the live project this migration is a no-op: the live definitions,
--     grants and owners are left exactly as they are.
--   * On a fresh project (staging, local tests, disaster recovery) it creates
--     organiser-only, SECURITY DEFINER functions with a fixed search_path.
--
-- RECONCILIATION STATUS: the bodies below are reconstructed from how the
-- application calls these functions. Before merging, replace them with the exact
-- live text, obtained with (read-only):
--   select pg_get_functiondef(p.oid), p.proacl
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('find_conference_account','conference_reviewer_directory');

do $migration$
begin
  if to_regprocedure('public.find_conference_account(text)') is null then
    execute $fn$
      create function public.find_conference_account(p_email text)
      returns table(user_id uuid, user_email text)
      language plpgsql stable security definer set search_path = ''
      as $body$
      begin
        if not private.has_role('organiser') then
          raise exception 'organiser role required' using errcode = '42501';
        end if;
        return query
          select u.id, u.email::text
          from auth.users u
          where lower(u.email) = lower(btrim(p_email))
          limit 1;
      end
      $body$;
    $fn$;
    revoke all on function public.find_conference_account(text) from public, anon;
    grant execute on function public.find_conference_account(text) to authenticated;
  end if;

  if to_regprocedure('public.conference_reviewer_directory()') is null then
    execute $fn$
      create function public.conference_reviewer_directory()
      returns table(user_id uuid, user_email text)
      language plpgsql stable security definer set search_path = ''
      as $body$
      begin
        if not private.has_role('organiser') then
          raise exception 'organiser role required' using errcode = '42501';
        end if;
        return query
          select r.user_id, u.email::text
          from public.user_roles r
          join auth.users u on u.id = r.user_id
          where r.role = 'reviewer'
          order by u.email;
      end
      $body$;
    $fn$;
    revoke all on function public.conference_reviewer_directory() from public, anon;
    grant execute on function public.conference_reviewer_directory() to authenticated;
  end if;
end
$migration$;
