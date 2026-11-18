-- OPTION A (recommended): official launch WITHOUT deleting anything.
-- NOT a migration: run manually, once, only after written LOC approval of
-- docs/LAUNCH_TRANSITION.md, a fresh backup, and a successful staging rehearsal.
--
-- Effect:
--   * Every existing test record is kept, still flagged is_demo=true, still
--     excluded from the public abstract book, and still visible to organisers.
--   * People who registered during testing can register again officially
--     (one test + one official registration per account, never two official).
--   * New records become official (is_demo=false); references lose the DEMO- prefix.
--   * Registration and submission are left CLOSED; organisers open them from the
--     dashboard Launch controls after the post-switch smoke test.
begin;

-- 1. Allow one official registration per account alongside an earlier test one.
--    Replaces unique(user_id) with unique(user_id, is_demo): no rows change.
alter table public.registrations drop constraint if exists registrations_user_id_key;
create unique index if not exists registrations_one_per_user_per_mode on public.registrations(user_id, is_demo);

-- 2. Test records can never enter the public abstract book.
alter table public.abstracts drop constraint if exists test_records_never_public;
alter table public.abstracts add constraint test_records_never_public check (not (is_demo and is_published));

-- 3. Switch new records to official, with both gates closed.
update public.conference_settings
   set demo_mode = false, registration_open = false, submissions_open = false
 where id = 1;

-- Sanity checks: abort the whole transaction if anything is unexpected.
do $$ begin
  -- no remaining unique constraint or index on registrations(user_id) alone
  -- (e.g. one created on the live project under a different name)
  if exists (
    select 1 from pg_index i
    where i.indrelid = 'public.registrations'::regclass and i.indisunique
      and i.indkey::text = (select attnum::text from pg_attribute where attrelid = 'public.registrations'::regclass and attname = 'user_id')
  ) then raise exception 'registrations still has a unique index on user_id alone; review before launch'; end if;
  if (select demo_mode from public.conference_settings where id = 1) then raise exception 'demo_mode still on'; end if;
  if exists (select 1 from public.public_abstracts p join public.abstracts a on a.id = p.id where a.is_demo) then
    raise exception 'a test abstract is in the public abstract book';
  end if;
end $$;

commit;
-- Rollback plan: only BEFORE any official record exists:
--   update public.conference_settings set demo_mode = true where id = 1;
-- (the index/constraint changes are harmless to keep). Once official records
-- exist, do not switch back; close the gates in Launch controls instead.
