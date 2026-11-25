alter table public.abstracts
  add column if not exists revision_request_id uuid,
  add column if not exists revision_instructions text,
  add column if not exists revision_due_on date,
  add column if not exists revision_submitted_at timestamptz,
  add column if not exists revision_response text;

alter table public.abstracts
  drop constraint if exists abstracts_status_check,
  drop constraint if exists abstract_pending_revision_has_instructions;
alter table public.abstracts
  add constraint abstracts_status_check
    check (status in ('draft','submitted','under_review','revision_requested','accepted','rejected')),
  add constraint abstract_pending_revision_has_instructions
    check (status <> 'revision_requested' or (
      revision_request_id is not null and revision_instructions is not null
      and char_length(btrim(revision_instructions)) between 1 and 4000
    ));

grant update (revision_request_id, revision_instructions, revision_due_on)
  on public.abstracts to authenticated;

create table if not exists private.abstract_revision_history (
  request_id uuid primary key,
  abstract_id uuid not null references public.abstracts(id) on delete cascade,
  instructions text not null,
  due_on date,
  submitted_at timestamptz not null,
  previous_title text not null,
  previous_body text not null,
  previous_file_path text,
  revised_title text not null,
  revised_body text not null,
  revised_file_path text,
  author_response text not null
);
alter table private.abstract_revision_history enable row level security;
revoke all on private.abstract_revision_history from public, anon, authenticated;

create or replace function private.guard_abstract_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if current_user = 'authenticated' and (
      new.revision_request_id is not null or new.revision_instructions is not null
      or new.revision_due_on is not null or new.revision_submitted_at is not null or new.revision_response is not null
    ) then
      raise insufficient_privilege using message = 'Revision data can only be saved through the revision workflow';
    end if;
    return new;
  end if;
  if current_user = 'authenticated' and old.status = 'revision_requested'
     and new.status <> 'revision_requested' then
    raise check_violation using message = 'The author must submit the revision before a decision';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke execute on function private.guard_abstract_revision() from public, anon, authenticated;
drop trigger if exists guard_abstract_revision on public.abstracts;
create trigger guard_abstract_revision before insert or update on public.abstracts
  for each row execute function private.guard_abstract_revision();

drop policy if exists abstract_files_revision_upload on storage.objects;
create policy abstract_files_revision_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'abstract-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.abstracts a
    where a.user_id = (select auth.uid())
      and a.status = 'revision_requested'
      and (storage.foldername(name))[2] = a.id::text
      and (storage.foldername(name))[3] = a.revision_request_id::text
      and (a.revision_due_on is null or a.revision_due_on >= (now() at time zone 'Africa/Lagos')::date)
  )
);

drop policy if exists abstract_files_organiser_revised_read on storage.objects;
create policy abstract_files_organiser_revised_read on storage.objects for select to authenticated
using (
  bucket_id = 'abstract-files' and (select private.has_role('organiser'))
  and exists (select 1 from public.abstracts a where a.file_path = name and a.revision_submitted_at is not null)
);

-- The private function performs a constrained author write without widening the
-- normal abstract UPDATE grant. The exposed wrapper runs as the signed-in caller.
create or replace function private.submit_abstract_revision(
  p_id uuid, p_request uuid, p_title text, p_body text, p_response text, p_file_path text, p_remove_file boolean
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  paper public.abstracts%rowtype;
  actor uuid := auth.uid();
  next_path text;
  saved_at timestamptz;
begin
  if actor is null then return false; end if;
  select * into paper from public.abstracts where id = p_id and user_id = actor for update;
  if not found or paper.status <> 'revision_requested' or p_request is distinct from paper.revision_request_id
    or (paper.revision_due_on is not null and paper.revision_due_on < (clock_timestamp() at time zone 'Africa/Lagos')::date)
  then return false; end if;

  next_path := case when p_remove_file then null else coalesce(p_file_path, paper.file_path) end;
  if p_file_path is not null and (
    p_remove_file or p_file_path not like actor::text || '/' || p_id::text || '/' || p_request::text || '/%'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'abstract-files' and o.name = p_file_path and o.owner_id = actor::text)
  ) then return false; end if;

  if p_title is null or char_length(btrim(p_title)) not between 8 and 250
    or p_body is null or char_length(p_body) > 5000
    or (p_body ~ '[^[:space:]]' and cardinality(regexp_split_to_array(btrim(p_body), '[[:space:]]+')) > 300)
    or (p_body !~ '[^[:space:]]' and next_path is null)
    or p_response is null or char_length(p_response) > 4000
  then return false; end if;

  saved_at := clock_timestamp();
  insert into private.abstract_revision_history values (
    p_request, paper.id, paper.revision_instructions, paper.revision_due_on, saved_at,
    paper.title, paper.body, paper.file_path, btrim(p_title), p_body, next_path, p_response
  );
  update public.abstracts
    set title = btrim(p_title), body = p_body, file_path = next_path, status = 'under_review',
        revision_submitted_at = saved_at, revision_response = p_response
    where id = paper.id;
  return true;
end;
$$;

create or replace function public.submit_abstract_revision(
  p_id uuid, p_request uuid, p_title text, p_body text, p_response text, p_file_path text, p_remove_file boolean
) returns boolean language sql security invoker set search_path = '' as $$
  select private.submit_abstract_revision(p_id, p_request, p_title, p_body, p_response, p_file_path, p_remove_file)
$$;

revoke execute on function private.submit_abstract_revision(uuid,uuid,text,text,text,text,boolean) from public, anon, authenticated;
revoke execute on function public.submit_abstract_revision(uuid,uuid,text,text,text,text,boolean) from public, anon, authenticated;
grant execute on function private.submit_abstract_revision(uuid,uuid,text,text,text,text,boolean) to authenticated;
grant execute on function public.submit_abstract_revision(uuid,uuid,text,text,text,text,boolean) to authenticated;
