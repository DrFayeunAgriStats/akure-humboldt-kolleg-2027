-- Security-boundary tests for the conference schema. LOCAL TESTING ONLY.
-- Run after 00_local_supabase_stub.sql and every file in supabase/migrations
-- (scripts/test-db.sh does this on a throwaway database). Any failure aborts.
\set ON_ERROR_STOP on


\i supabase/tests/_helpers.sql

-- Fixtures (as superuser) ----------------------------------------------------
insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'organiser@example.org'),
  ('00000000-0000-0000-0000-00000000000b', 'author@example.org'),
  ('00000000-0000-0000-0000-00000000000c', 'other@example.org'),
  ('00000000-0000-0000-0000-00000000000d', 'reviewer@example.org');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-00000000000a', 'organiser');
update public.conference_settings set registration_open = false, submissions_open = false, demo_mode = true where id = 1;

create temp table words as select string_agg('word', ' ') as body from generate_series(1, 260);
grant select on words to authenticated;

-- Anonymous visitors ---------------------------------------------------------
set role anon;
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-00000000000b','author@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,true)$$,
  'anon cannot register', '42501');
select t.expect_error($$select public.grant_conference_reviewer('other@example.org')$$, 'anon cannot call grant_conference_reviewer', '42501');
select t.expect_error($$select * from public.find_conference_account('author@example.org')$$, 'anon cannot look up accounts', '42501');
select t.expect_rows($$select * from public.conference_settings$$, 1, 'anon can read launch settings');
reset role;

-- Registration gate ----------------------------------------------------------
select t.as_user('00000000-0000-0000-0000-00000000000b', 'author@example.org');
set role authenticated;
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-00000000000b','author@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,true)$$,
  'registration rejected while registration_open=false', '42501');
reset role;
update public.conference_settings set registration_open = true where id = 1;
set role authenticated;
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-00000000000b','author@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,false)$$,
  'official (is_demo=false) record rejected while demo_mode=true', '42501');
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-00000000000c','other@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,true)$$,
  'cannot register on behalf of another user', '42501');
reset role;
update public.conference_settings set registration_deadline = now() - interval '1 minute' where id = 1;
set role authenticated;
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-00000000000b','author@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,true)$$,
  'registration rejected after the registration deadline', '42501');
reset role;
update public.conference_settings set registration_deadline = now() + interval '30 days' where id = 1;
set role authenticated;
insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-00000000000b','author@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,true);
select t.ok(true, 'registration accepted when open, before deadline, matching demo_mode');
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-00000000000b','author@example.org','Ada Again','FUTA','Nigeria','humboldtian',false,true,'academic',true,true)$$,
  'duplicate registration rejected', '23505');

-- Abstract gate --------------------------------------------------------------
select t.expect_error($$insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select r.id, r.user_id, 'Ada Author', r.email, 'FUTA', 'Soil carbon in agroforests', (select body from words), 1, 'oral', true from public.registrations r$$,
  'abstract rejected while submissions_open=false', '42501');
reset role;
update public.conference_settings set submissions_open = true where id = 1;
set role authenticated;
select t.expect_error($$insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select r.id, r.user_id, 'Ada Author', r.email, 'FUTA', 'Soil carbon in agroforests', 'too short', 1, 'oral', true from public.registrations r$$,
  'abstract under 250 words rejected by constraint', '23514');
insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select r.id, r.user_id, 'Ada Author', r.email, 'FUTA', 'Soil carbon in agroforests', (select body from words), 1, 'oral', true from public.registrations r;
select t.ok(true, 'abstract accepted while submissions open');
select t.expect_rows($$update public.abstracts set status = 'accepted' returning 1$$, 0, 'author cannot change abstract status');
select t.expect_error($$insert into storage.objects(bucket_id,name) values ('abstract-files','00000000-0000-0000-0000-00000000000c/x.pdf')$$,
  'cannot upload into another user''s folder', '42501');
insert into storage.objects(bucket_id,name) values ('abstract-files','00000000-0000-0000-0000-00000000000b/x.pdf');
select t.ok(true, 'author can upload into own folder while submissions open');
reset role;
update public.conference_settings set submissions_open = false where id = 1;
set role authenticated;
select t.expect_error($$insert into storage.objects(bucket_id,name) values ('abstract-files','00000000-0000-0000-0000-00000000000b/y.pdf')$$,
  'upload rejected once submissions close', '42501');

-- Privilege escalation -------------------------------------------------------
select t.expect_error($$insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-00000000000b','organiser')$$,
  'participant cannot self-grant organiser', '42501');
select t.expect_error($$insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-00000000000b','reviewer')$$,
  'participant cannot self-grant reviewer', '42501');
select t.expect_error($$select public.grant_conference_reviewer('author@example.org')$$, 'participant cannot call grant_conference_reviewer', '42501');
select t.expect_error($$select public.revoke_conference_reviewer('00000000-0000-0000-0000-00000000000a')$$, 'participant cannot call revoke_conference_reviewer', '42501');
select t.expect_error($$select * from public.conference_reviewer_directory()$$, 'participant cannot read reviewer directory', '42501');
select t.expect_error($$select * from public.find_conference_account('organiser@example.org')$$, 'participant cannot look up accounts', '42501');
select t.expect_rows($$update public.conference_settings set registration_open = false returning 1$$, 0, 'participant cannot change launch settings');

-- Cross-user privacy ---------------------------------------------------------
reset role;
select t.as_user('00000000-0000-0000-0000-00000000000c', 'other@example.org');
set role authenticated;
select t.expect_rows($$select * from public.registrations$$, 0, 'another user cannot see the registration');
select t.expect_rows($$select * from public.abstracts$$, 0, 'another user cannot see the abstract');
select t.expect_rows($$select * from storage.objects$$, 0, 'another user cannot see the attachment');

-- Organiser: reviewer administration and launch settings ----------------------
reset role;
select t.as_user('00000000-0000-0000-0000-00000000000a', 'organiser@example.org');
set role authenticated;
select t.expect_error($$insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-00000000000d','reviewer')$$,
  'even organisers cannot write user_roles directly', '42501');
select t.expect_rows($$select * from public.grant_conference_reviewer('  Reviewer@Example.org ')$$, 1, 'organiser grants reviewer (email normalised)');
select t.expect_error($$select public.grant_conference_reviewer('reviewer@example.org')$$, 'duplicate reviewer grant reported', '23505');
select t.expect_error($$select public.grant_conference_reviewer('nobody@example.org')$$, 'unknown email reported', 'P0002');
select t.expect_rows($$select * from public.conference_reviewer_directory()$$, 1, 'directory lists the new reviewer');
select t.expect_rows($$select * from public.find_conference_account('author@example.org')$$, 1, 'organiser can look up an account');
select t.expect_rows($$select * from public.user_roles where role = 'reviewer' and granted_by = '00000000-0000-0000-0000-00000000000a'$$, 1, 'grant is audited with granted_by');
update public.conference_settings set registration_open = false, abstract_deadline = '2027-01-15T23:59:00+01:00' where id = 1;
select t.ok((select not registration_open and updated_by = '00000000-0000-0000-0000-00000000000a' from public.conference_settings), 'organiser updates launch settings; updated_by stamped');
select t.expect_error($$update public.conference_settings set demo_mode = false$$, 'organiser cannot flip demo_mode from the client', '42501');
insert into public.review_assignments(abstract_id, reviewer_id) select id, '00000000-0000-0000-0000-00000000000d' from public.abstracts;
select t.ok(true, 'organiser assigns the abstract to the reviewer');

-- Reviewer boundaries (blind review) -----------------------------------------
reset role;
-- link the earlier upload to the abstract so attachment access can be tested
update public.abstracts set file_path = '00000000-0000-0000-0000-00000000000b/x.pdf';
insert into storage.objects(bucket_id,name) values ('abstract-files','00000000-0000-0000-0000-00000000000c/unrelated.pdf');
select t.ok(
  (select pg_get_function_result(p.oid) from pg_proc p where p.proname = 'conference_reviewer_assignments') !~* '(email|author|institution|co_authors|user_id)',
  'blind-review function exposes no author fields');
select t.as_user('00000000-0000-0000-0000-00000000000d', 'reviewer@example.org');
set role authenticated;
select t.expect_rows($$select * from public.abstracts$$, 0, 'reviewer cannot read abstract rows directly (no author name/email)');
select t.expect_rows($$select * from public.conference_reviewer_assignments()$$, 1, 'reviewer sees the assigned abstract through the blind function');
select t.expect_rows($$select * from public.registrations$$, 0, 'reviewer cannot see registrations');
select t.expect_rows($$select * from storage.objects where name like '%/x.pdf'$$, 1, 'reviewer can open the assigned attachment');
select t.expect_rows($$select * from storage.objects where name like '%unrelated%'$$, 0, 'reviewer cannot see an attachment not linked to the assignment');
insert into public.reviews(assignment_id, reviewer_id, relevance, rigour, clarity, impact, recommendation, comments)
  select id, '00000000-0000-0000-0000-00000000000d', 4, 4, 4, 4, 'accept', 'Sound methodology and clear framing.' from public.review_assignments;
select t.ok(true, 'reviewer submits a review for the assignment');
select t.expect_error($$select public.grant_conference_reviewer('other@example.org')$$, 'reviewer cannot grant reviewer roles', '42501');

-- Revocation -----------------------------------------------------------------
reset role;
select t.as_user('00000000-0000-0000-0000-00000000000a', 'organiser@example.org');
set role authenticated;
select t.ok(public.revoke_conference_reviewer('00000000-0000-0000-0000-00000000000d'), 'organiser revokes reviewer role');
select t.ok(not public.revoke_conference_reviewer('00000000-0000-0000-0000-00000000000a'), 'revoke cannot remove an organiser role');
select t.expect_rows($$select * from public.user_roles where role = 'organiser'$$, 1, 'organiser role untouched');
reset role;
select t.as_user('00000000-0000-0000-0000-00000000000d', 'reviewer@example.org');
set role authenticated;
select t.expect_rows($$update public.reviews set comments = 'Changed after revocation of the role.' returning 1$$, 0, 'revoked reviewer can no longer edit reviews');
select t.expect_error($$select * from public.conference_reviewer_assignments()$$, 'revoked reviewer cannot list assignments', '42501');
select t.expect_rows($$select * from public.abstracts$$, 0, 'revoked reviewer cannot read abstracts');
select t.expect_rows($$select * from storage.objects$$, 0, 'revoked reviewer cannot open attachments');
reset role;
set role anon;
select t.expect_error($$select * from public.conference_reviewer_assignments()$$, 'anon cannot call the reviewer function', '42501');
reset role;
-- authors and organisers keep their access
select t.as_user('00000000-0000-0000-0000-00000000000b', 'author@example.org');
set role authenticated;
select t.expect_rows($$select * from public.abstracts$$, 1, 'author still reads own abstract');
reset role;
select t.as_user('00000000-0000-0000-0000-00000000000a', 'organiser@example.org');
set role authenticated;
select t.expect_rows($$select * from public.abstracts$$, 1, 'organiser still reads all abstracts');
reset role;
\echo 'ALL SECURITY BOUNDARY TESTS PASSED'
