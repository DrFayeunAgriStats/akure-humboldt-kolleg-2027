-- LIVE-DRIFT BASELINE (LOCAL TESTING ONLY).
-- Runs on the live-like clone (baseline migrations + fixtures/live_drift_2026-11-18.sql)
-- BEFORE the corrective migrations, and proves the fixture really reproduces each
-- gap the 2026-11-18 audit found. Every PASS here means "gap reproduced".
-- Everything runs inside one transaction that is rolled back.
\set ON_ERROR_STOP on
begin;
\i supabase/tests/_helpers.sql

insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-0000000000a2', 'organiser@example.org'),
  ('00000000-0000-0000-0000-0000000000b2', 'author@example.org'),
  ('00000000-0000-0000-0000-0000000000d2', 'reviewer@example.org'),
  ('00000000-0000-0000-0000-0000000000e2', 'candidate@example.org');
insert into public.user_roles(user_id, role) values
  ('00000000-0000-0000-0000-0000000000a2', 'organiser'), ('00000000-0000-0000-0000-0000000000d2', 'reviewer');
update public.conference_settings set demo_mode = true, registration_open = true, submissions_open = true where id = 1;
insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000b2','author@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,true);
insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select id, user_id, 'Ada Author', email, 'FUTA', 'Soil carbon in agroforests', (select string_agg('word', ' ') from generate_series(1, 260)), 1, 'oral', true
  from public.registrations;
insert into public.review_assignments(abstract_id, reviewer_id) select id, '00000000-0000-0000-0000-0000000000d2' from public.abstracts;

-- Audit finding 4: demo_mode is updatable by organisers through the client role.
select t.ok(has_column_privilege('authenticated', 'public.conference_settings', 'demo_mode', 'UPDATE'),
  'GAP REPRODUCED: authenticated holds UPDATE on conference_settings.demo_mode');
select t.as_user('00000000-0000-0000-0000-0000000000a2', 'organiser@example.org');
set local role authenticated;
select t.expect_rows($$update public.conference_settings set demo_mode = false returning 1$$, 1,
  'GAP REPRODUCED: an organiser can switch demo_mode off through the API');
-- Audit finding 2: direct organiser reviewer-role writes.
select t.expect_rows($$insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000e2', 'reviewer') returning 1$$, 1,
  'GAP REPRODUCED: an organiser can insert a reviewer role directly (no audit trail)');
select t.expect_rows($$delete from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000e2' returning 1$$, 1,
  'GAP REPRODUCED: an organiser can delete a reviewer role directly');
-- Column-wide UPDATE also lets an organiser rewrite author content or the test flag.
select t.expect_rows($$update public.abstracts set is_demo = false, author_name = 'Changed' returning 1$$, 1,
  'GAP REPRODUCED: an organiser can rewrite author fields and is_demo on an abstract');
reset role;

-- Audit finding 3: TRUNCATE is granted to client roles, and RLS does not govern it.
select t.ok(has_table_privilege('anon', 'public.registrations', 'TRUNCATE')
        and has_table_privilege('authenticated', 'public.abstracts', 'TRUNCATE'),
  'GAP REPRODUCED: anon and authenticated hold TRUNCATE on conference tables');
savepoint before_truncate;
select t.as_user('00000000-0000-0000-0000-0000000000b2', 'author@example.org');
set local role authenticated;
truncate public.reviews;
select t.ok(true, 'GAP REPRODUCED: a participant session can TRUNCATE a conference table (RLS bypassed)');
reset role;
rollback to savepoint before_truncate;

-- Audit finding 1: blind review and revocation.
select t.as_user('00000000-0000-0000-0000-0000000000d2', 'reviewer@example.org');
set local role authenticated;
select t.expect_rows($$select email from public.abstracts where email = 'author@example.org'$$, 1,
  'GAP REPRODUCED: an assigned reviewer reads the author''s email');
reset role;
delete from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000d2';
select t.as_user('00000000-0000-0000-0000-0000000000d2', 'reviewer@example.org');
set local role authenticated;
select t.expect_rows($$select * from public.abstracts$$, 1,
  'GAP REPRODUCED: a reviewer whose role was revoked still reads the abstract');
reset role;

-- Verified positives from the audit hold on the clone too.
select t.ok(not has_function_privilege('anon', 'public.find_conference_account(text)', 'EXECUTE')
        and not has_function_privilege('anon', 'public.conference_reviewer_directory()', 'EXECUTE'),
  'positive: anon cannot execute the live organiser lookup functions');
select t.ok((select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r') and
            (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r') = 9,
  'positive: RLS enabled on all nine public conference tables');
\echo 'LIVE DRIFT REPRODUCED'
rollback;
