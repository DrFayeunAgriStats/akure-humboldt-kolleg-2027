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
