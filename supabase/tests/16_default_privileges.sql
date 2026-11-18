-- DEFAULT-PRIVILEGE REGRESSION TEST (LOCAL TESTING ONLY). Runs after ALL migrations,
-- on both the fresh database (Supabase's standard schema-level defaults, from the
-- stub) and the live-like clone (plus the live GLOBAL EXECUTE default to authenticated).
-- It records the real effect of migration 20261118000200 section 5 on objects created
-- AFTER it, and proves the CI guard catches an unprotected new function.
-- Everything runs in one transaction that is rolled back.
\set ON_ERROR_STOP on
begin;
\i supabase/tests/_helpers.sql

-- 1. A new TABLE in public: schema-level defaults were revoked, so it starts closed.
create table public.zz_probe_table(id int);
select t.ok(not has_table_privilege('anon', 'public.zz_probe_table', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
        and not has_table_privilege('authenticated', 'public.zz_probe_table', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'),
  'new table in public: no privileges for anon or authenticated (schema-level defaults revoked)');

-- 2. A new FUNCTION in public: the narrowed guarantee. Default privileges do NOT make it
--    private. anon reaches it through PostgreSQL''s built-in EXECUTE-to-PUBLIC default.
create function public.zz_probe_function() returns int language sql as 'select 1';
select t.ok(has_function_privilege('anon', 'public.zz_probe_function()', 'EXECUTE'),
  'new function in public: anon CAN execute by default (PUBLIC grant) — explicit REVOKE is required');
select t.ok(has_function_privilege('authenticated', 'public.zz_probe_function()', 'EXECUTE'),
  'new function in public: authenticated CAN execute by default — explicit REVOKE is required');
select t.ok((select exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                            where a.grantee = 0 and a.privilege_type = 'EXECUTE')
             from pg_proc p where p.oid = 'public.zz_probe_function()'::regprocedure),
  'new function in public: the PUBLIC grant comes from built-in defaults, which a schema-level REVOKE cannot remove');
select t.ok(exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'zz_probe_function' and has_function_privilege('anon', p.oid, 'EXECUTE')),
  'CI guard condition matches the unprotected probe (15_privilege_matrix.sql would fail on it)');

-- 3. The documented pattern closes it.
revoke execute on function public.zz_probe_function() from public, anon, authenticated;
select t.ok(not has_function_privilege('anon', 'public.zz_probe_function()', 'EXECUTE')
        and not has_function_privilege('authenticated', 'public.zz_probe_function()', 'EXECUTE'),
  'after the documented explicit REVOKE: neither anon nor authenticated can execute');

-- 4. Supabase-managed schemas are untouched by this project's migrations.
select t.ok(not exists (select 1 from pg_default_acl d join pg_namespace n on n.oid = d.defaclnamespace
                        where n.nspname not in ('public')),
  'no schema-specific default privileges were changed outside public');
\echo 'DEFAULT PRIVILEGE TESTS PASSED'
rollback;
