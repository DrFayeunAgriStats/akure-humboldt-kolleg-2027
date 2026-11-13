-- Akure Humboldt Kolleg 2027 — isolated project schema.
-- Apply to a NEW, dedicated Supabase project, NEVER to a live AFDS product database.
-- No fake registrants or abstracts are seeded.
create extension if not exists pgcrypto;
create schema if not exists private;

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('organiser','reviewer')),
  granted_at timestamptz not null default now(),
  primary key(user_id,role)
);

-- Safe definer: runs no arbitrary SQL, has fixed search_path and checks auth.uid().
-- Keep function in the unexposed private schema, not public/Data API.
create or replace function private.has_role(p_role text)
returns boolean language sql stable security definer set search_path = ''
as $$select (select auth.uid()) is not null and exists (
  select 1 from public.user_roles where user_id=(select auth.uid()) and role=p_role
)$$;
revoke all on function private.has_role(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_role(text) to authenticated;

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  serial_number bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 160),
  institution text not null,
  email text not null,
  phone text,
  city text,
  country text not null,
  humboldt_status text not null check (humboldt_status in ('humboldtian','non-humboldtian')),
  german_fellowship boolean not null,
  submitting_abstract boolean not null,
  category text not null check (category in ('student','academic','professional','other')),
  consent_data boolean not null check (consent_data is true),
  consent_media boolean not null default false,
  consent_updates boolean not null default false
);
create index idx_reg_created on public.registrations(created_at desc);

create table public.abstracts (
  id uuid primary key default gen_random_uuid(),
  serial_number bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  registration_id uuid not null references public.registrations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  co_authors text,
  email text not null,
  institution text not null,
  title text not null check (char_length(title) between 8 and 250),
  body text not null,
  track int not null check (track between 1 and 5),
  presentation_type text not null check(presentation_type in ('oral','poster')),
  keywords text[] not null default '{}',
  file_path text,
  status text not null default 'submitted' check(status in ('draft','submitted','under_review','accepted','rejected')),
  is_published boolean not null default false,
  decision_at timestamptz,
  constraint public_only_accepted check(not is_published or status='accepted')
);
create index idx_abstract_track_status on public.abstracts(track,status);
create index idx_abstract_user on public.abstracts(user_id);

create table public.review_assignments (
  id uuid primary key default gen_random_uuid(),
  abstract_id uuid not null references public.abstracts(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique(abstract_id,reviewer_id)
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.review_assignments(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  relevance int not null check(relevance between 1 and 5),
  rigour int not null check(rigour between 1 and 5),
  clarity int not null check(clarity between 1 and 5),
  impact int not null check(impact between 1 and 5),
  recommendation text not null check (recommendation in ('accept','revise','reject')),
  comments text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  institution text,
  talk_title text,
  short_bio text,
  photo_url text,
  published boolean not null default false,
  sort_order int not null default 0
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  room text,
  session_type text not null check (session_type in ('keynote','technical','poster','social')),
  published boolean not null default false,
  constraint session_time_order check(ends_at > starts_at)
);

-- All exposed tables use RLS. Empty permissions are deny-by-default.
alter table public.user_roles enable row level security;
alter table public.registrations enable row level security;
alter table public.abstracts enable row level security;
alter table public.review_assignments enable row level security;
alter table public.reviews enable row level security;
alter table public.speakers enable row level security;
alter table public.sessions enable row level security;

create policy roles_self_or_organiser on public.user_roles for select to authenticated
using (user_id=(select auth.uid()) or private.has_role('organiser'));
-- Only a service role/DB administrator can grant or revoke staff roles.

create policy reg_owner_or_admin_read on public.registrations for select to authenticated
using(user_id=(select auth.uid()) or private.has_role('organiser'));
create policy reg_owner_insert on public.registrations for insert to authenticated
with check(user_id=(select auth.uid()) and email=(select auth.jwt()->>'email'));
-- Registration is free, and direct record updates are not enabled.

create policy abstract_owner_admin_reviewer_read on public.abstracts for select to authenticated
using(user_id=(select auth.uid()) or private.has_role('organiser')
  or exists(select 1 from public.review_assignments ra where ra.abstract_id=abstracts.id and ra.reviewer_id=(select auth.uid())));
-- Do not publish full abstract rows: they contain private email/file paths.
-- A curated public_abstracts table is synchronised by an internal trigger below.
create policy abstract_owner_insert on public.abstracts for insert to authenticated
with check(user_id=(select auth.uid())
 and exists(select 1 from public.registrations r where r.id=registration_id and r.user_id=(select auth.uid()))
 and status='submitted' and is_published=false and decision_at is null);
create policy abstract_admin_update on public.abstracts for update to authenticated
using (private.has_role('organiser')) with check(private.has_role('organiser'));

create policy assignments_self_or_admin_read on public.review_assignments for select to authenticated
using(reviewer_id=(select auth.uid()) or private.has_role('organiser'));
create policy assignments_admin_insert on public.review_assignments for insert to authenticated
with check(private.has_role('organiser'));
create policy assignments_admin_delete on public.review_assignments for delete to authenticated
using(private.has_role('organiser'));

create policy reviews_assigned_or_admin_read on public.reviews for select to authenticated
using(reviewer_id=(select auth.uid()) or private.has_role('organiser'));
create policy reviews_assigned_insert on public.reviews for insert to authenticated
with check(reviewer_id=(select auth.uid()) and private.has_role('reviewer') and exists(
 select 1 from public.review_assignments a where a.id=assignment_id and a.reviewer_id=(select auth.uid())));
create policy reviews_assigned_update on public.reviews for update to authenticated
using(reviewer_id=(select auth.uid()) and private.has_role('reviewer'))
with check(reviewer_id=(select auth.uid()) and private.has_role('reviewer') and exists(
 select 1 from public.review_assignments a where a.id=assignment_id and a.reviewer_id=(select auth.uid())));

create policy speakers_published on public.speakers for select to anon,authenticated using(published=true);
create policy speakers_admin_select on public.speakers for select to authenticated using(private.has_role('organiser'));
create policy speakers_admin_write on public.speakers for all to authenticated using(private.has_role('organiser')) with check(private.has_role('organiser'));
create policy sessions_published on public.sessions for select to anon,authenticated using(published=true);
create policy sessions_admin_select on public.sessions for select to authenticated using(private.has_role('organiser'));
create policy sessions_admin_write on public.sessions for all to authenticated using(private.has_role('organiser')) with check(private.has_role('organiser'));

-- Make explicit privileges; policies still apply.
grant select on public.speakers,public.sessions to anon;
grant select,insert,update on public.user_roles,public.registrations,public.abstracts,public.review_assignments,public.reviews,public.speakers,public.sessions to authenticated;
grant delete on public.review_assignments,public.speakers,public.sessions to authenticated;
grant usage,select on all sequences in schema public to authenticated;

-- Curated public release table contains no personal email or file path.
create table public.public_abstracts (
  id uuid primary key references public.abstracts(id) on delete cascade,
  serial_number bigint not null,
  title text not null,
  body text not null,
  author_name text not null,
  institution text not null,
  track int not null,
  presentation_type text not null,
  keywords text[] not null,
  published_at timestamptz not null default now()
);
alter table public.public_abstracts enable row level security;
create policy public_approved_abstracts_only on public.public_abstracts for select to anon,authenticated using(true);
grant select on public.public_abstracts to anon,authenticated;

create or replace function private.sync_public_abstract()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op='DELETE' then
    delete from public.public_abstracts where id=old.id;
    return old;
  end if;
  if new.status='accepted' and new.is_published then
    insert into public.public_abstracts(id,serial_number,title,body,author_name,institution,track,presentation_type,keywords,published_at)
    values(new.id,new.serial_number,new.title,new.body,new.author_name,new.institution,new.track,new.presentation_type,new.keywords,now())
    on conflict(id) do update set title=excluded.title,body=excluded.body,author_name=excluded.author_name,institution=excluded.institution,
      track=excluded.track,presentation_type=excluded.presentation_type,keywords=excluded.keywords;
  else
    delete from public.public_abstracts where id=new.id;
  end if;
  return new;
end$$;
revoke all on function private.sync_public_abstract() from public, anon, authenticated;
create trigger sync_approved_abstracts after insert or update or delete on public.abstracts
for each row execute function private.sync_public_abstract();

-- Storage is never made public. Files stored in a user's UUID prefix only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('abstract-files','abstract-files',false,2097152,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
create policy abstract_files_owner_upload on storage.objects for insert to authenticated
with check(bucket_id='abstract-files' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.registrations r where r.user_id=(select auth.uid())));
create policy abstract_files_owner_read on storage.objects for select to authenticated
using(bucket_id='abstract-files' and ((storage.foldername(name))[1]=(select auth.uid())::text or private.has_role('organiser')));
-- No anonymous access, no file updates, no public bucket.

-- Manual bootstrap, after creating organiser Auth user:
-- insert into public.user_roles(user_id,role) values ('<actual-user-uuid>','organiser');
-- Do not use user-editable metadata to determine staff privileges.
