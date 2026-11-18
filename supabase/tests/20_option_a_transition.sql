-- Option A transition test. LOCAL TESTING ONLY (throwaway database).
-- Proves that supabase/pending/02_option_a_retain_and_segregate.sql keeps every
-- test record, lets earlier testers register officially exactly once, and keeps
-- test and official records from mixing. Run by scripts/test-db.sh.
\set ON_ERROR_STOP on
\i supabase/tests/_helpers.sql

insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'organiser@example.org'),
  ('00000000-0000-0000-0000-0000000000b1', 'tester@example.org'),
  ('00000000-0000-0000-0000-0000000000c1', 'newcomer@example.org'),
  ('00000000-0000-0000-0000-0000000000d1', 'reviewer@example.org');
insert into public.user_roles(user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'organiser'), ('00000000-0000-0000-0000-0000000000d1', 'reviewer');
create temp table words as select string_agg('word', ' ') as body from generate_series(1, 260);
grant select on words to authenticated;

-- Pre-launch: a tester registers and submits in test mode, and it is reviewed.
update public.conference_settings set demo_mode = true, registration_open = true, submissions_open = true where id = 1;
select t.as_user('00000000-0000-0000-0000-0000000000b1', 'tester@example.org');
set role authenticated;
insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000b1','tester@example.org','Tess Tester','FUTA','Nigeria','humboldtian',false,true,'academic',true,true);
insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select id, user_id, 'Tess Tester', email, 'FUTA', 'Test-mode abstract on soil carbon', (select body from words), 2, 'poster', true from public.registrations;
reset role;
insert into public.review_assignments(abstract_id, reviewer_id) select id, '00000000-0000-0000-0000-0000000000d1' from public.abstracts;
insert into public.reviews(assignment_id, reviewer_id, relevance, rigour, clarity, impact, recommendation, comments)
  select id, '00000000-0000-0000-0000-0000000000d1', 3, 3, 3, 3, 'revise', 'Test-mode review kept after launch.' from public.review_assignments;
create temp table before_counts as
  select (select count(*) from public.registrations) r, (select count(*) from public.abstracts) a,
         (select count(*) from public.review_assignments) ra, (select count(*) from public.reviews) rv;

-- The switch.
\i supabase/pending/02_option_a_retain_and_segregate.sql

select t.ok((select r = (select count(*) from public.registrations) and a = (select count(*) from public.abstracts)
             and ra = (select count(*) from public.review_assignments) and rv = (select count(*) from public.reviews) from before_counts),
  'Option A: every test registration, abstract, assignment and review is kept');
select t.ok((select not demo_mode and not registration_open and not submissions_open from public.conference_settings), 'Option A: official mode with both gates closed');
select t.ok((select bool_and(is_demo) from public.registrations), 'Option A: existing records still flagged as test records');

-- Gates closed: nobody can register yet.
select t.as_user('00000000-0000-0000-0000-0000000000b1', 'tester@example.org');
set role authenticated;
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000b1','tester@example.org','Tess Tester','FUTA','Nigeria','humboldtian',false,true,'academic',true,false)$$,
  'closed after switch: official registration refused', '42501');
reset role;

-- Organiser opens registration and submission through the permitted columns.
select t.as_user('00000000-0000-0000-0000-0000000000a1', 'organiser@example.org');
set role authenticated;
update public.conference_settings set registration_open = true, submissions_open = true where id = 1;
reset role;

select t.as_user('00000000-0000-0000-0000-0000000000b1', 'tester@example.org');
set role authenticated;
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000b1','tester@example.org','Tess Tester','FUTA','Nigeria','humboldtian',false,true,'academic',true,true)$$,
  'after switch: new TEST registrations are refused', '42501');
insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000b1','tester@example.org','Tess Tester','FUTA','Nigeria','humboldtian',false,true,'academic',true,false);
select t.ok(true, 'earlier tester registers officially alongside the kept test record');
select t.expect_error($$insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000b1','tester@example.org','Tess Again','FUTA','Nigeria','humboldtian',false,true,'academic',true,false)$$,
  'a second official registration for the same account is refused', '23505');
select t.expect_rows($$select * from public.registrations$$, 2, 'tester sees both own records (one test, one official)');
select t.expect_error($$insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select id, user_id, 'Tess Tester', email, 'FUTA', 'Official abstract on test registration', (select body from words), 1, 'oral', false from public.registrations where is_demo$$,
  'official abstract cannot be linked to the old test registration', '42501');
select t.expect_error($$insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select id, user_id, 'Tess Tester', email, 'FUTA', 'Test abstract after launch', (select body from words), 1, 'oral', true from public.registrations where is_demo$$,
  'after switch: new TEST abstracts are refused', '42501');
insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select id, user_id, 'Tess Tester', email, 'FUTA', 'Official abstract on soil carbon', (select body from words), 1, 'oral', false from public.registrations where not is_demo;
select t.ok(true, 'tester submits an official abstract on the official registration');
reset role;

select t.as_user('00000000-0000-0000-0000-0000000000c1', 'newcomer@example.org');
set role authenticated;
insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000c1','newcomer@example.org','Nia Newcomer','UNILAG','Nigeria','non-humboldtian',false,false,'student',true,false);
select t.ok(true, 'a first-time participant registers officially');
select t.expect_rows($$select * from public.registrations$$, 1, 'newcomer cannot see anyone else''s records');
reset role;

-- Organiser: test abstracts can never be published; official ones can after review.
select t.as_user('00000000-0000-0000-0000-0000000000a1', 'organiser@example.org');
set role authenticated;
select t.expect_error($$update public.abstracts set status = 'accepted', is_published = true where is_demo$$,
  'a test abstract can never enter the public abstract book', '23514');
select t.expect_rows($$select * from public.abstracts where is_demo$$, 1, 'organiser still sees the kept test abstract');
select t.expect_rows($$select * from public.reviews$$, 1, 'test-mode review kept and visible to organisers');
reset role;
select t.expect_rows($$select * from public.public_abstracts$$, 0, 'public abstract book contains no test records');
\echo 'OPTION A TRANSITION TESTS PASSED'
