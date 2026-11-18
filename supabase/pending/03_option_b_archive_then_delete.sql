-- OPTION B: archive test records, then DELETE them from the live tables.
-- DESTRUCTIVE. Do not run without the project owner's explicit written
-- authorisation, a verified backup, and the archive export reviewed.
-- The guard below refuses to run unless the operator types the confirmation:
--   set akh.confirm = 'DELETE-TEST-RECORDS-AUTHORISED';
-- Storage files of test abstracts must then be removed separately in the
-- Supabase dashboard (list produced at the end), after the archive is verified.
begin;
do $$ begin
  if current_setting('akh.confirm', true) is distinct from 'DELETE-TEST-RECORDS-AUTHORISED' then
    raise exception 'Refusing to delete: written authorisation confirmation not set';
  end if;
end $$;

create schema if not exists archive;
revoke all on schema archive from public, anon, authenticated;
create table archive.test_registrations as select now() as archived_at, * from public.registrations where is_demo;
create table archive.test_abstracts as select now() as archived_at, * from public.abstracts where is_demo;
create table archive.test_review_assignments as select now() as archived_at, ra.* from public.review_assignments ra join public.abstracts a on a.id = ra.abstract_id where a.is_demo;
create table archive.test_reviews as select now() as archived_at, r.* from public.reviews r join public.review_assignments ra on ra.id = r.assignment_id join public.abstracts a on a.id = ra.abstract_id where a.is_demo;

-- reviews/assignments cascade from abstracts; abstracts restrict registrations, so delete abstracts first.
delete from public.abstracts where is_demo;
delete from public.registrations where is_demo;
update public.conference_settings set demo_mode = false, registration_open = false, submissions_open = false where id = 1;

select file_path as storage_object_to_remove_after_verification from archive.test_abstracts where file_path is not null;
commit;
