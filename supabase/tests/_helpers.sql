-- Shared assertion helpers for the local database test suites. LOCAL TESTING ONLY.
set client_min_messages = notice;
create schema t;
grant usage on schema t to anon, authenticated;
-- Runs as the CURRENT role, so RLS and privileges apply to the tested SQL.
create function t.expect_error(p_sql text, p_label text, p_state text default null)
returns void language plpgsql as $$
declare v_state text;
begin
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    if p_state is not null and v_state <> p_state then
      raise exception 'FAIL % — expected SQLSTATE %, got % (%)', p_label, p_state, v_state, sqlerrm;
    end if;
    raise notice 'PASS %', p_label;
    return;
  end;
  raise exception 'FAIL % — statement succeeded but should have been rejected', p_label;
end$$;
create function t.expect_rows(p_sql text, p_expected bigint, p_label text)
returns void language plpgsql as $$
declare v bigint;
begin
  execute 'with q as (' || p_sql || ') select count(*) from q' into v;
  if v <> p_expected then raise exception 'FAIL % — expected % rows, got %', p_label, p_expected, v; end if;
  raise notice 'PASS %', p_label;
end$$;
create function t.ok(p_cond boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_cond, false) then raise exception 'FAIL %', p_label; end if;
  raise notice 'PASS %', p_label;
end$$;
create function t.as_user(p_id uuid, p_email text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'email', p_email)::text, false);
$$;
grant execute on all functions in schema t to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Function-exposure guard (single definition used by 15_ and 16_ suites).
-- Functions are identified by EXACT signature (schema, name and argument
-- types), never by name alone, so an overload of an approved name is not
-- treated as approved.
-- ---------------------------------------------------------------------------
create function t.sig(p oid) returns text language sql stable as $$
  select format('%s.%s(%s)', n.nspname, p2.proname, oidvectortypes(p2.proargtypes))
  from pg_proc p2 join pg_namespace n on n.oid = p2.pronamespace where p2.oid = p
$$;

-- The reviewed public functions that signed-in users may execute. Each one checks
-- the caller's conference role internally; anon may execute none of them.
create function t.approved_api_functions() returns table(signature text, fn regprocedure)
language sql stable as $$
  select s, to_regprocedure(s) from unnest(array[
    'public.conference_reviewer_assignments()',
    'public.conference_reviewer_directory()',
    'public.find_conference_account(text)',
    'public.grant_conference_reviewer(text)',
    'public.revoke_conference_reviewer(uuid)'
  ]) as s
$$;

-- Non-extension functions in the API-exposed public schema.
create function t.public_api_function_oids() returns setof oid language sql stable as $$
  select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
$$;

-- Violations: any public function anon can execute.
create function t.guard_anon_violations() returns setof text language sql stable as $$
  select t.sig(o) from t.public_api_function_oids() o where has_function_privilege('anon', o, 'EXECUTE') order by 1
$$;

-- Violations: any public function authenticated can execute whose exact signature is not approved.
create function t.guard_authenticated_violations() returns setof text language sql stable as $$
  select t.sig(o) from t.public_api_function_oids() o
  where has_function_privilege('authenticated', o, 'EXECUTE')
    and o not in (select fn::oid from t.approved_api_functions() where fn is not null)
  order by 1
$$;
grant execute on all functions in schema t to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Intended table-level privileges for the client roles on the nine conference
-- tables (single source of truth for 15_ and 30_ suites). Column-level grants
-- are asserted separately.
-- ---------------------------------------------------------------------------
create function t.expected_table_privileges() returns table(role text, tbl text, priv text) language sql immutable as $$
  values
  ('anon','speakers','SELECT'), ('anon','sessions','SELECT'), ('anon','public_abstracts','SELECT'), ('anon','conference_settings','SELECT'),
  ('authenticated','user_roles','SELECT'),
  ('authenticated','registrations','SELECT'), ('authenticated','registrations','INSERT'),
  ('authenticated','abstracts','SELECT'), ('authenticated','abstracts','INSERT'),
  ('authenticated','review_assignments','SELECT'), ('authenticated','review_assignments','INSERT'), ('authenticated','review_assignments','DELETE'),
  ('authenticated','reviews','SELECT'), ('authenticated','reviews','INSERT'),
  ('authenticated','speakers','SELECT'), ('authenticated','speakers','INSERT'), ('authenticated','speakers','UPDATE'), ('authenticated','speakers','DELETE'),
  ('authenticated','sessions','SELECT'), ('authenticated','sessions','INSERT'), ('authenticated','sessions','UPDATE'), ('authenticated','sessions','DELETE'),
  ('authenticated','public_abstracts','SELECT'),
  ('authenticated','conference_settings','SELECT')
$$;
create function t.actual_table_privileges() returns table(role text, tbl text, priv text) language sql stable as $$
  select r.role, tb.tbl, p.priv
  from (values ('anon'), ('authenticated')) r(role)
  cross join (values ('user_roles'),('registrations'),('abstracts'),('review_assignments'),('reviews'),
                     ('speakers'),('sessions'),('public_abstracts'),('conference_settings')) tb(tbl)
  cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(priv)
  where has_table_privilege(r.role, 'public.' || tb.tbl, p.priv)
$$;
create function t.table_privilege_diff() returns setof text language sql stable as $$
  select 'extra: ' || role || ' ' || priv || ' ' || tbl from (select * from t.actual_table_privileges() except select * from t.expected_table_privileges()) x
  union all
  select 'missing: ' || role || ' ' || priv || ' ' || tbl from (select * from t.expected_table_privileges() except select * from t.actual_table_privileges()) y
$$;
grant execute on all functions in schema t to anon, authenticated;
