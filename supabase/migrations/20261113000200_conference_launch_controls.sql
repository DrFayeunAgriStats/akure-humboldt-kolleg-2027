-- Launch controls: registration and submissions are deliberately closed until approved.
create table if not exists public.conference_settings (
  id smallint primary key default 1 check (id = 1),
  registration_open boolean not null default false,
  submissions_open boolean not null default false,
  registration_deadline timestamptz,
  abstract_deadline timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.conference_settings (id,registration_open,submissions_open)
values (1,false,false) on conflict(id) do nothing;
alter table public.conference_settings enable row level security;
create policy conference_settings_public_read on public.conference_settings
for select to anon,authenticated using(true);
create policy conference_settings_admin_update on public.conference_settings
for update to authenticated using(private.has_role('organiser'))
with check(private.has_role('organiser') and id=1);
grant select on public.conference_settings to anon,authenticated;
grant update(registration_open,submissions_open,registration_deadline,abstract_deadline,updated_at)
on public.conference_settings to authenticated;

-- Browser requests and accidental API bugs cannot bypass these database gates.
drop policy if exists reg_owner_insert on public.registrations;
create policy reg_owner_insert on public.registrations for insert to authenticated
with check (
  user_id=(select auth.uid())
  and lower(email)=lower((select auth.jwt()->>'email'))
  and consent_data=true
  and exists(select 1 from public.conference_settings s where s.id=1 and s.registration_open)
);
drop policy if exists abstract_owner_insert on public.abstracts;
create policy abstract_owner_insert on public.abstracts for insert to authenticated
with check (
  user_id=(select auth.uid()) and status='submitted' and is_published=false
  and decision_at is null
  and exists(select 1 from public.conference_settings s where s.id=1 and s.submissions_open)
  and exists(select 1 from public.registrations r where r.id=registration_id and r.user_id=(select auth.uid()))
);
alter table public.abstracts add constraint abstract_body_250_to_300_words
check (cardinality(regexp_split_to_array(btrim(body), E'\\s+')) between 250 and 300);

-- Assigned reviewers may securely download *only their assigned* file attachments.
create policy abstract_files_assigned_reviewer_read on storage.objects
for select to authenticated
using (
 bucket_id='abstract-files' and private.has_role('reviewer')
 and exists(
   select 1 from public.abstracts a
   join public.review_assignments ra on ra.abstract_id=a.id
   where a.file_path=storage.objects.name and ra.reviewer_id=(select auth.uid())
 )
);
-- Staff roles may only be granted through the trusted database administrator.
revoke insert,update,delete on public.user_roles from authenticated;
