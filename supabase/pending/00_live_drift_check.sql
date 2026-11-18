-- READ-ONLY. Run in the live project's SQL editor BEFORE applying any new migration,
-- and send the output for review. It shows whether the live database has drifted from
-- the repository (hand-made functions, extra or renamed policies, grants, constraints).
-- Nothing here changes data, schema or permissions.

-- 1. Every function in public/private: owner, definer, search_path, volatility and who may execute it.
select 'function' as section,
       n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as name,
       json_build_object(
         'security_definer', p.prosecdef,
         'config', p.proconfig,
         'volatility', p.provolatile,
         'owner', pg_get_userbyid(p.proowner),
         'acl', p.proacl,
         'returns', pg_get_function_result(p.oid))::text as detail
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by 2;

-- 2. Full text of the two functions the repository must reconcile with.
select 'function_definition' as section, p.proname as name, pg_get_functiondef(p.oid) as detail
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('find_conference_account', 'conference_reviewer_directory');

-- 3. Every RLS policy on conference tables and storage.objects (extra PERMISSIVE policies widen access).
select 'policy' as section, schemaname || '.' || tablename || ' :: ' || policyname as name,
       json_build_object('cmd', cmd, 'permissive', permissive, 'roles', roles, 'using', qual, 'check', with_check)::text as detail
from pg_policies
where schemaname = 'public' or (schemaname = 'storage' and tablename = 'objects')
order by 2;

-- 4. RLS enabled on every conference table.
select 'rls_enabled' as section, c.relname as name, c.relrowsecurity::text as detail
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 2;

-- 5. Table and column privileges for client roles on sensitive tables.
select 'table_grant' as section, table_name || ' -> ' || grantee as name, string_agg(privilege_type, ',' order by privilege_type) as detail
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and table_name in ('user_roles', 'conference_settings', 'registrations', 'abstracts', 'review_assignments', 'reviews')
group by table_name, grantee order by 2;
select 'column_grant' as section, table_name || '.' || column_name || ' -> ' || grantee as name, privilege_type as detail
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'conference_settings' and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE'
order by 2;

-- 6. Constraints that the transition depends on, and current launch settings.
select 'constraint' as section, conrelid::regclass || ' :: ' || conname as name, pg_get_constraintdef(oid) as detail
from pg_constraint where conrelid in ('public.registrations'::regclass, 'public.abstracts'::regclass) order by 2;
select 'settings' as section, 'conference_settings' as name, row_to_json(s)::text as detail from public.conference_settings s;

-- 7. Default privileges (global entries have schema '-'). Schema-level REVOKEs cannot
--    override global entries or PostgreSQL's built-in EXECUTE-to-PUBLIC for functions.
select 'default_acl' as section,
       coalesce(n.nspname, '-') || ' :: ' || pg_get_userbyid(d.defaclrole) || ' :: ' ||
       case d.defaclobjtype when 'r' then 'tables' when 'f' then 'functions' when 'S' then 'sequences' when 'T' then 'types' when 'n' then 'schemas' end as name,
       d.defaclacl::text as detail
from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace
order by 2;

-- 8. Run separately (fails harmlessly if the project was set up without the Supabase CLI):
--    which repository migrations the live project has recorded.
-- select version, name from supabase_migrations.schema_migrations order by version;
