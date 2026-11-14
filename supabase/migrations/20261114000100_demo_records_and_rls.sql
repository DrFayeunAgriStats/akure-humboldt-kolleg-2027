-- Bid demonstration mode. Data is isolated in the conference-specific Supabase project.
-- All demonstration entries are flagged so the organiser can remove them separately before official launch.
alter table public.conference_settings add column if not exists demo_mode boolean not null default false;
alter table public.registrations add column if not exists is_demo boolean not null default false;
alter table public.abstracts add column if not exists is_demo boolean not null default false;

drop policy if exists reg_owner_insert on public.registrations;
create policy reg_owner_insert on public.registrations for insert to authenticated
with check (
 user_id=(select auth.uid())
 and lower(email)=lower((select auth.jwt()->>'email'))
 and consent_data=true
 and exists(select 1 from public.conference_settings s
   where s.id=1 and s.registration_open
   and is_demo=s.demo_mode)
);

drop policy if exists abstract_owner_insert on public.abstracts;
create policy abstract_owner_insert on public.abstracts for insert to authenticated
with check (
 user_id=(select auth.uid()) and status='submitted' and is_published=false
 and decision_at is null
 and exists(select 1 from public.conference_settings s
   where s.id=1 and s.submissions_open and is_demo=s.demo_mode)
 and exists(select 1 from public.registrations r
   where r.id=registration_id and r.user_id=(select auth.uid())
   and r.is_demo=is_demo)
);
-- Do not enable the gates here: rollout waits for website copy and build verification.
