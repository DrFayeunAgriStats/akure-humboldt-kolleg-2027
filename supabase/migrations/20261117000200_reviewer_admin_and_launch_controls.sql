-- Reviewer-role administration and consistent launch controls.
-- Additive and non-destructive: no rows are deleted or rewritten, no RLS policy
-- is loosened, and direct writes to user_roles remain revoked from clients.

------------------------------------------------------------------------------
-- 1. Audit columns
------------------------------------------------------------------------------
alter table public.user_roles
  add column if not exists granted_by uuid references auth.users(id) on delete set null;

alter table public.conference_settings
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

-- Keep updated_at / updated_by trustworthy whatever the client sends.
create or replace function private.stamp_conference_settings()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end$$;
revoke all on function private.stamp_conference_settings() from public, anon, authenticated;
drop trigger if exists stamp_conference_settings on public.conference_settings;
create trigger stamp_conference_settings before update on public.conference_settings
for each row execute function private.stamp_conference_settings();

-- demo_mode is deliberately NOT client-updatable (see the existing column
-- grant): moving from test records to official records is a reviewed database
-- operation, documented in docs/LAUNCH_TRANSITION.md.

------------------------------------------------------------------------------
-- 2. Reviewer-role administration (organiser only, audited)
--    Clients still cannot insert/update/delete user_roles directly. These two
--    SECURITY DEFINER functions are the only path, and each verifies the caller
--    holds the organiser role. They can grant/revoke the reviewer role only;
--    organiser roles stay under database-administrator control.
------------------------------------------------------------------------------
create or replace function public.grant_conference_reviewer(p_email text)
returns table(user_id uuid, user_email text)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_user uuid;
  v_email text;
begin
  if not private.has_role('organiser') then
    raise exception 'organiser role required' using errcode = '42501';
  end if;
  select u.id, u.email::text into v_user, v_email
  from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1;
  if v_user is null then
    raise exception 'no conference account for that email' using errcode = 'P0002';
  end if;
  insert into public.user_roles(user_id, role, granted_by)
  values (v_user, 'reviewer', (select auth.uid()))
  on conflict (user_id, role) do nothing;
  if not found then
    raise exception 'account is already a reviewer' using errcode = '23505';
  end if;
  return query select v_user, v_email;
end$$;
revoke all on function public.grant_conference_reviewer(text) from public, anon;
grant execute on function public.grant_conference_reviewer(text) to authenticated;

create or replace function public.revoke_conference_reviewer(p_user_id uuid)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not private.has_role('organiser') then
    raise exception 'organiser role required' using errcode = '42501';
  end if;
  delete from public.user_roles where user_id = p_user_id and role = 'reviewer';
  return found;
end$$;
revoke all on function public.revoke_conference_reviewer(uuid) from public, anon;
grant execute on function public.revoke_conference_reviewer(uuid) to authenticated;

------------------------------------------------------------------------------
-- 3. Launch gates: also enforce published deadlines in the database.
--    Each policy keeps every existing condition and adds the deadline check,
--    so these replacements are strictly tighter than the current policies.
------------------------------------------------------------------------------
drop policy if exists reg_owner_insert on public.registrations;
create policy reg_owner_insert on public.registrations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and lower(email) = lower((select auth.jwt()->>'email'))
  and consent_data = true
  and exists (
    select 1 from public.conference_settings s
    where s.id = 1 and s.registration_open
      and public.registrations.is_demo = s.demo_mode
      and (s.registration_deadline is null or now() < s.registration_deadline)
  )
);

drop policy if exists abstract_owner_insert on public.abstracts;
create policy abstract_owner_insert on public.abstracts for insert to authenticated
with check (
  user_id = (select auth.uid()) and status = 'submitted' and is_published = false and decision_at is null
  and exists (
    select 1 from public.conference_settings s
    where s.id = 1 and s.submissions_open
      and public.abstracts.is_demo = s.demo_mode
      and (s.abstract_deadline is null or now() < s.abstract_deadline)
  )
  and exists (
    select 1 from public.registrations r
    where r.id = public.abstracts.registration_id
      and r.user_id = (select auth.uid())
      and r.is_demo = public.abstracts.is_demo
  )
);

-- Attachments can only be uploaded while submissions are open.
drop policy if exists abstract_files_owner_upload on storage.objects;
create policy abstract_files_owner_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'abstract-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.registrations r where r.user_id = (select auth.uid()))
  and exists (
    select 1 from public.conference_settings s
    where s.id = 1 and s.submissions_open
      and (s.abstract_deadline is null or now() < s.abstract_deadline)
  )
);
