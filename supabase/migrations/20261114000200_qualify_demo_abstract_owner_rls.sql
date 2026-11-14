-- Correct the ambiguous nested RLS expression from the preceding migration:
-- r.is_demo=is_demo resolved to the inner registration column on both sides.
-- Explicitly compare with the new outer abstract row.
drop policy if exists abstract_owner_insert on public.abstracts;
create policy abstract_owner_insert on public.abstracts for insert to authenticated
with check (
 user_id=(select auth.uid()) and status='submitted' and is_published=false and decision_at is null
 and exists (
   select 1 from public.conference_settings s
   where s.id=1 and s.submissions_open
     and public.abstracts.is_demo=s.demo_mode
 )
 and exists (
   select 1 from public.registrations r
   where r.id=public.abstracts.registration_id
     and r.user_id=(select auth.uid())
     and r.is_demo=public.abstracts.is_demo
 )
);
