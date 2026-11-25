-- LOCAL TESTING ONLY. Exercise a revision across the same reference and roles.
\set ON_ERROR_STOP on
\i supabase/tests/_helpers.sql
\i supabase/tests/fixtures/sample_data.sql

create temp table revision_target as
  select id, serial_number, user_id from public.abstracts where email='author.one@sample.test';
grant select on revision_target to authenticated, anon;

set role anon;
select t.expect_error($$select public.submit_abstract_revision(id, null,'Revised title','Revised text','',null,false)
  from revision_target$$, 'anonymous callers cannot submit revisions', '42501');
reset role;

update public.conference_settings set submissions_open=false where id=1;
select t.as_user('20000000-0000-0000-0000-00000000000a','org.sample@sample.test');
set role authenticated;
update public.abstracts set status='revision_requested',
  revision_request_id='10000000-0000-0000-0000-000000000001',
  revision_instructions='Clarify the methods', revision_due_on=current_date-3
where id=(select id from revision_target);
select t.expect_error($$update public.abstracts set status='accepted' where id=(select id from revision_target)$$,
  'organiser cannot decide while revision is open', '23514');
reset role;

select t.as_user('20000000-0000-0000-0000-00000000000b','author.one@sample.test');
set role authenticated;
select t.ok(not (select public.submit_abstract_revision(id,'10000000-0000-0000-0000-000000000001',
  'Revised title','Revised text','',null,false) from revision_target), 'expired revision is refused');
reset role;

select t.as_user('20000000-0000-0000-0000-00000000000a','org.sample@sample.test');
set role authenticated;
update public.abstracts set revision_due_on=current_date+3,
  revision_request_id='10000000-0000-0000-0000-000000000002'
where id=(select id from revision_target);
reset role;

select t.as_user('20000000-0000-0000-0000-00000000000c','author.two@sample.test');
set role authenticated;
select t.ok(not (select public.submit_abstract_revision(id,'10000000-0000-0000-0000-000000000002',
  'Revised title','Revised text','',null,false) from revision_target), 'another author cannot submit this revision');
reset role;

select t.as_user('20000000-0000-0000-0000-00000000000b','author.one@sample.test');
set role authenticated;
select t.ok(not (select public.submit_abstract_revision(id,'10000000-0000-0000-0000-000000000001',
  'Revised title','Revised text','',null,false) from revision_target), 'stale request is refused');
select t.ok(not (select public.submit_abstract_revision(id,'10000000-0000-0000-0000-000000000002',
  'Revised title','','',null,true) from revision_target), 'removing the only abstract content is refused');
insert into storage.objects(bucket_id,name,owner_id)
select 'abstract-files', user_id::text || '/' || id || '/10000000-0000-0000-0000-000000000002/revision.pdf', user_id::text
from revision_target;
select t.ok((select public.submit_abstract_revision(id,'10000000-0000-0000-0000-000000000002',
  'Revised title','','Methods clarified',
  user_id::text || '/' || id || '/10000000-0000-0000-0000-000000000002/revision.pdf',false) from revision_target),
  'author can replace the file after general submissions have closed');
select t.ok(not (select public.submit_abstract_revision(id,'10000000-0000-0000-0000-000000000002',
  'Revised title','Duplicate submission','',null,false) from revision_target), 'the same request cannot be completed twice');
select t.expect_rows($$select a.id from public.abstracts a join revision_target r using (id,serial_number)
  where a.status='under_review' and a.revision_response='Methods clarified' and a.file_path like '%/revision.pdf'$$,
  1,'revision preserves reference and returns the updated abstract to review');
reset role;
select t.expect_rows($$select 1 from private.abstract_revision_history
  where instructions='Clarify the methods' and author_response='Methods clarified' and previous_file_path like '%/sample.pdf'$$,
  1,'revision keeps its instructions, response and previous attachment');

select t.as_user('20000000-0000-0000-0000-00000000000a','org.sample@sample.test');
set role authenticated;
select t.expect_rows($$select name from storage.objects where name like '%/revision.pdf'$$,
  1,'organiser can open the revised attachment');
select t.expect_rows($$update public.abstracts set status='accepted' where id=(select id from revision_target) returning id$$,
  1,'organiser can accept once the revision is in');
reset role;
select 'ABSTRACT REVISIONS PASSED';
