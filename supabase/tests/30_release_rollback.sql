-- RELEASE ROLLBACK REHEARSAL (LOCAL TESTING ONLY). Runs on the live-like clone with
-- sample data AFTER supabase/release/step_a_apply.sql and step_b_apply.sql.
-- Rolls STEP B back with supabase/release/step_b_rollback_app_compat.sql, proves the
-- previous app's access paths work again while removed privileges stay removed, then
-- rolls forward with step_b_apply.sql and proves the secure state is restored.
\set ON_ERROR_STOP on
\i supabase/tests/_helpers.sql

create temp table counts_before as
  select (select count(*) from public.registrations) r, (select count(*) from public.abstracts) a,
         (select count(*) from public.reviews) v, (select count(*) from public.user_roles) u;

-- After STEP B: blind review and audited role changes only.
select t.as_user('20000000-0000-0000-0000-00000000000d', 'reviewer.sample@sample.test');
set role authenticated;
select t.expect_rows($$select * from public.abstracts$$, 0, 'after STEP B: reviewer cannot read abstract rows directly');
reset role;
select t.as_user('20000000-0000-0000-0000-00000000000a', 'org.sample@sample.test');
set role authenticated;
select t.expect_error($$insert into public.user_roles(user_id, role) values ('20000000-0000-0000-0000-00000000000c', 'reviewer')$$,
  'after STEP B: organiser cannot write roles directly', '42501');
reset role;

-- ROLLBACK for the previous app.
\i supabase/release/step_b_rollback_app_compat.sql
select t.as_user('20000000-0000-0000-0000-00000000000d', 'reviewer.sample@sample.test');
set role authenticated;
select t.expect_rows($$select * from public.abstracts$$, 1, 'rolled back: previous app''s reviewer page can read its assigned abstract again');
reset role;
select t.as_user('20000000-0000-0000-0000-00000000000a', 'org.sample@sample.test');
set role authenticated;
select t.expect_rows($$insert into public.user_roles(user_id, role) values ('20000000-0000-0000-0000-00000000000c', 'reviewer') returning 1$$, 1,
  'rolled back: previous app''s organiser panel can add a reviewer directly');
select t.expect_rows($$delete from public.user_roles where user_id = '20000000-0000-0000-0000-00000000000c' and role = 'reviewer' returning 1$$, 1,
  'rolled back: previous app''s organiser panel can remove a reviewer directly');
select t.expect_error($$update public.conference_settings set demo_mode = false$$, 'rolled back: demo_mode still not updatable', '42501');
select t.expect_error($$truncate public.reviews$$, 'rolled back: TRUNCATE still refused', '42501');
reset role;
select t.ok(not has_table_privilege('anon', 'public.registrations', 'SELECT')
        and not has_column_privilege('authenticated', 'public.abstracts', 'is_demo', 'UPDATE'),
  'rolled back: other removed privileges stay removed');
select t.ok((select r = (select count(*) from public.registrations) and a = (select count(*) from public.abstracts)
             and v = (select count(*) from public.reviews) and u = (select count(*) from public.user_roles) from counts_before),
  'rolled back: no rows lost or added');

-- ROLL FORWARD.
\i supabase/release/step_b_apply.sql
select t.as_user('20000000-0000-0000-0000-00000000000d', 'reviewer.sample@sample.test');
set role authenticated;
select t.expect_rows($$select * from public.abstracts$$, 0, 'rolled forward: blind review enforced again');
select t.expect_rows($$select * from public.conference_reviewer_assignments()$$, 1, 'rolled forward: reviewer workspace function works');
reset role;
select t.as_user('20000000-0000-0000-0000-00000000000a', 'org.sample@sample.test');
set role authenticated;
select t.expect_error($$insert into public.user_roles(user_id, role) values ('20000000-0000-0000-0000-00000000000c', 'reviewer')$$,
  'rolled forward: direct role writes refused again', '42501');
reset role;
select t.ok(not exists (select 1 from t.guard_anon_violations()) and not exists (select 1 from t.guard_authenticated_violations()),
  'rolled forward: exact-signature function guard passes');
select t.ok(not exists (select 1 from t.table_privilege_diff()),
  'rolled forward: table privileges exactly match the intended matrix'
  || coalesce(' — ' || (select string_agg(d, ', ') from t.table_privilege_diff() d), ''));
select t.ok(not has_column_privilege('authenticated', 'public.conference_settings', 'demo_mode', 'UPDATE')
        and not exists (select 1 from pg_policies where tablename = 'user_roles' and cmd in ('INSERT','DELETE','UPDATE','ALL')),
  'rolled forward: demo_mode closed and no client role-write policies');
select t.ok((select demo_mode and registration_open from public.conference_settings where id = 1),
  'throughout: demo_mode stays true and launch settings are unchanged');
\echo 'RELEASE ROLLBACK REHEARSAL PASSED'
