-- Blind review and reviewer revocation. Tightening only; no data is changed.
--
-- Problem fixed: the abstracts SELECT policy let anyone with a review assignment
-- read the FULL abstract row (author name, email, institution, co-authors)
-- directly through the API, and it did not check the reviewer role, so a
-- reviewer whose role had been removed kept that access.
--
-- After this migration:
--   * Reviewers no longer read public.abstracts directly.
--   * They read their assignments through public.conference_reviewer_assignments(),
--     which returns only blind fields and requires a CURRENT reviewer role.
--   * Attachment access for reviewers also requires a current reviewer role
--     (unchanged rule, now evaluated through a definer helper because the
--     storage policy can no longer see abstracts rows as the reviewer).
--   * Authors and organisers keep exactly the access they had.

-- 1. Authors and organisers only.
drop policy if exists abstract_owner_admin_reviewer_read on public.abstracts;
drop policy if exists abstract_owner_or_admin_read on public.abstracts;
create policy abstract_owner_or_admin_read on public.abstracts for select to authenticated
using (user_id = (select auth.uid()) or private.has_role('organiser'));

-- 2. Blind assignment list for the calling reviewer.
create or replace function public.conference_reviewer_assignments()
returns table(
  assignment_id uuid, abstract_id uuid, serial_number bigint, title text, body text,
  track int, keywords text[], presentation_type text, status text, is_demo boolean, file_path text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.has_role('reviewer') then
    raise exception 'reviewer role required' using errcode = '42501';
  end if;
  return query
    select ra.id, a.id, a.serial_number, a.title, a.body, a.track, a.keywords,
           a.presentation_type, a.status, a.is_demo, a.file_path
    from public.review_assignments ra
    join public.abstracts a on a.id = ra.abstract_id
    where ra.reviewer_id = (select auth.uid())
    order by ra.assigned_at;
end$$;
revoke all on function public.conference_reviewer_assignments() from public, anon;
grant execute on function public.conference_reviewer_assignments() to authenticated;

-- 3. Attachment access. file_path is returned above because the signed link the
--    reviewer receives contains it anyway; its folder is an opaque account id that
--    reviewers have no way to resolve to a person.
create or replace function private.reviewer_can_read_file(p_name text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role('reviewer') and exists (
    select 1 from public.abstracts a
    join public.review_assignments ra on ra.abstract_id = a.id
    where a.file_path = p_name and ra.reviewer_id = (select auth.uid())
  )
$$;
revoke all on function private.reviewer_can_read_file(text) from public, anon;
grant execute on function private.reviewer_can_read_file(text) to authenticated;

drop policy if exists abstract_files_assigned_reviewer_read on storage.objects;
create policy abstract_files_assigned_reviewer_read on storage.objects for select to authenticated
using (bucket_id = 'abstract-files' and private.reviewer_can_read_file(name));

-- 4. The settings trigger needs no elevated rights.
alter function private.stamp_conference_settings() security invoker;
