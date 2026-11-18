-- PRIVILEGE MATRIX (LOCAL TESTING ONLY). Runs after ALL migrations, on both a fresh
-- database and the live-like clone. Asserts the exact table, column and function
-- privileges the client roles hold, and that the audited live gaps are closed.
\set ON_ERROR_STOP on
\i supabase/tests/_helpers.sql

-- Expected table-level privileges for client roles. Anything not listed must be absent.
create temp table expected(role text, tbl text, priv text);
insert into expected values
  ('anon','speakers','SELECT'), ('anon','sessions','SELECT'), ('anon','public_abstracts','SELECT'), ('anon','conference_settings','SELECT'),
  ('authenticated','user_roles','SELECT'),
  ('authenticated','registrations','SELECT'), ('authenticated','registrations','INSERT'),
  ('authenticated','abstracts','SELECT'), ('authenticated','abstracts','INSERT'),
  ('authenticated','review_assignments','SELECT'), ('authenticated','review_assignments','INSERT'), ('authenticated','review_assignments','DELETE'),
  ('authenticated','reviews','SELECT'), ('authenticated','reviews','INSERT'),
  ('authenticated','speakers','SELECT'), ('authenticated','speakers','INSERT'), ('authenticated','speakers','UPDATE'), ('authenticated','speakers','DELETE'),
  ('authenticated','sessions','SELECT'), ('authenticated','sessions','INSERT'), ('authenticated','sessions','UPDATE'), ('authenticated','sessions','DELETE'),
  ('authenticated','public_abstracts','SELECT'),
  ('authenticated','conference_settings','SELECT');

create temp table actual as
  select r.role, t.tbl, p.priv
  from (values ('anon'), ('authenticated')) r(role)
  cross join (values ('user_roles'),('registrations'),('abstracts'),('review_assignments'),('reviews'),
                     ('speakers'),('sessions'),('public_abstracts'),('conference_settings')) t(tbl)
  cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(priv)
  where has_table_privilege(r.role, 'public.' || t.tbl, p.priv);

select t.ok(not exists (select * from actual except select * from expected),
  'matrix: no client role holds a table privilege beyond the intended set'
  || coalesce(' — extra: ' || (select string_agg(role||' '||priv||' '||tbl, ', ') from (select * from actual except select * from expected) x), ''));
select t.ok(not exists (select * from expected except select * from actual),
  'matrix: every intended table privilege is present (legitimate workflows intact)'
  || coalesce(' — missing: ' || (select string_agg(role||' '||priv||' '||tbl, ', ') from (select * from expected except select * from actual) x), ''));
select t.ok(not exists (select 1 from actual where priv in ('TRUNCATE','REFERENCES','TRIGGER')),
  'matrix: no TRUNCATE, REFERENCES or TRIGGER for anon/authenticated');

-- Column-level UPDATE grants.
select t.ok(not has_column_privilege('authenticated','public.conference_settings','demo_mode','UPDATE')
        and not has_column_privilege('anon','public.conference_settings','demo_mode','UPDATE'),
  'columns: demo_mode is not updatable by any client role');
select t.ok(has_column_privilege('authenticated','public.conference_settings','registration_open','UPDATE')
        and has_column_privilege('authenticated','public.conference_settings','abstract_deadline','UPDATE'),
  'columns: Launch controls columns remain updatable (RLS limits them to organisers)');
select t.ok(has_column_privilege('authenticated','public.abstracts','status','UPDATE')
        and has_column_privilege('authenticated','public.abstracts','is_published','UPDATE')
        and not has_column_privilege('authenticated','public.abstracts','is_demo','UPDATE')
        and not has_column_privilege('authenticated','public.abstracts','author_name','UPDATE')
        and not has_column_privilege('authenticated','public.abstracts','email','UPDATE')
        and not has_column_privilege('authenticated','public.abstracts','body','UPDATE'),
  'columns: abstracts allow decision fields only (author text, email and is_demo immutable)');
select t.ok(not has_column_privilege('authenticated','public.registrations','is_demo','UPDATE')
        and not has_column_privilege('authenticated','public.registrations','email','UPDATE'),
  'columns: registrations cannot be edited by clients');
select t.ok(not has_column_privilege('authenticated','public.user_roles','role','UPDATE'),
  'columns: user_roles cannot be updated by clients');

-- Policies.
select t.ok(not exists (select 1 from pg_policies where tablename = 'user_roles' and cmd in ('INSERT','DELETE','UPDATE','ALL')),
  'policies: no client write policy remains on user_roles (live add/remove policies dropped)');
select t.ok(not exists (select 1 from pg_policies where tablename = 'abstracts' and policyname = 'abstract_owner_admin_reviewer_read'),
  'policies: the reviewer branch of the abstracts read policy is gone');

-- SECURITY DEFINER functions.
select t.ok(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','private') and p.prosecdef
    and (has_function_privilege('anon', p.oid, 'EXECUTE')
         or exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'))),
  'functions: no SECURITY DEFINER function is executable by anon or PUBLIC');
select t.ok(not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','private') and p.prosecdef
    and coalesce(array_to_string(p.proconfig, ','), '') not like '%search_path=%'),
  'functions: every SECURITY DEFINER function pins search_path');
select t.ok((select string_agg(p.proname, ',' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.prosecdef and has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  = 'conference_reviewer_assignments,conference_reviewer_directory,find_conference_account,grant_conference_reviewer,revoke_conference_reviewer',
  'functions: the API-callable SECURITY DEFINER set is exactly the five reviewed functions');

-- Behaviour: the audited gaps are closed and legitimate actions still work.
insert into auth.users(id, email) values
  ('00000000-0000-0000-0000-0000000000a3', 'organiser@example.org'),
  ('00000000-0000-0000-0000-0000000000b3', 'author@example.org'),
  ('00000000-0000-0000-0000-0000000000e3', 'candidate@example.org');
insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000a3', 'organiser');
update public.conference_settings set demo_mode = true, registration_open = true, submissions_open = true where id = 1;
insert into public.registrations(user_id,email,full_name,institution,country,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,is_demo)
  values ('00000000-0000-0000-0000-0000000000b3','author@example.org','Ada Author','FUTA','Nigeria','humboldtian',false,true,'academic',true,true);
insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,is_demo)
  select id, user_id, 'Ada Author', email, 'FUTA', 'Soil carbon in agroforests', (select string_agg('word', ' ') from generate_series(1, 260)), 1, 'oral', true
  from public.registrations;

select t.as_user('00000000-0000-0000-0000-0000000000a3', 'organiser@example.org');
set role authenticated;
select t.expect_error($$update public.conference_settings set demo_mode = false$$, 'closed: organiser cannot switch demo_mode through the API', '42501');
update public.conference_settings set registration_open = false where id = 1;
select t.ok((select not registration_open from public.conference_settings), 'works: organiser closes registration from Launch controls');
update public.conference_settings set registration_open = true where id = 1;
select t.expect_error($$insert into public.user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000e3','reviewer')$$, 'closed: organiser cannot insert a role directly', '42501');
select t.expect_error($$delete from public.user_roles where role = 'organiser'$$, 'closed: organiser cannot delete roles directly', '42501');
select t.expect_rows($$select * from public.grant_conference_reviewer('candidate@example.org')$$, 1, 'works: organiser grants reviewer through the audited function');
select t.ok(public.revoke_conference_reviewer('00000000-0000-0000-0000-0000000000e3'), 'works: organiser revokes reviewer through the audited function');
select t.expect_error($$select public.grant_conference_reviewer('organiser@example.org')$$, 'closed: organiser cannot make themselves a reviewer (live rule kept)', '42501');
select t.expect_error($$update public.abstracts set is_demo = false$$, 'closed: organiser cannot flip a test abstract to official', '42501');
select t.expect_error($$update public.abstracts set author_name = 'Changed'$$, 'closed: organiser cannot rewrite author fields', '42501');
select t.expect_rows($$update public.abstracts set status = 'under_review' returning 1$$, 1, 'works: organiser records a status decision');
select t.expect_error($$truncate public.reviews$$, 'closed: TRUNCATE refused for a signed-in session', '42501');
select t.expect_error($$select * from public.find_conference_account('ab')$$, 'live validation kept: find_conference_account rejects invalid email', 'P0001');
reset role;

select t.as_user('00000000-0000-0000-0000-0000000000b3', 'author@example.org');
set role authenticated;
select t.expect_error($$update public.registrations set full_name = 'Changed'$$, 'closed: participant cannot edit a registration', '42501');
select t.expect_error($$select * from public.find_conference_account('organiser@example.org')$$, 'live check kept: participant refused by find_conference_account', 'P0001');
select t.expect_error($$select * from public.conference_reviewer_directory()$$, 'live check kept: participant refused by conference_reviewer_directory', 'P0001');
reset role;

set role anon;
select t.expect_error($$select * from public.registrations$$, 'closed: anon has no access to registrations at all', '42501');
select t.expect_error($$truncate public.abstracts$$, 'closed: TRUNCATE refused for anon', '42501');
select t.expect_rows($$select * from public.conference_settings$$, 1, 'works: anon reads launch settings for the public pages');
select t.expect_rows($$select * from public.public_abstracts$$, 0, 'works: anon reads the public abstract book');
reset role;
\echo 'PRIVILEGE MATRIX TESTS PASSED'
