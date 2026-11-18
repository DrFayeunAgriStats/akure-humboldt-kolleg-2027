-- READ-ONLY pre-launch report. Safe to run on the live project at any time.
-- Shows what currently exists so the LOC can make the data-retention decision.
select 'conference_settings' as item, json_build_object(
  'demo_mode', demo_mode, 'registration_open', registration_open, 'submissions_open', submissions_open,
  'registration_deadline', registration_deadline, 'abstract_deadline', abstract_deadline)::text as detail
from public.conference_settings where id = 1
union all select 'registrations (test / official)', format('%s / %s', count(*) filter (where is_demo), count(*) filter (where not is_demo)) from public.registrations
union all select 'abstracts (test / official)', format('%s / %s', count(*) filter (where is_demo), count(*) filter (where not is_demo)) from public.abstracts
union all select 'test abstracts with attachments', count(*)::text from public.abstracts where is_demo and file_path is not null
union all select 'review assignments on test abstracts', count(*)::text from public.review_assignments ra join public.abstracts a on a.id = ra.abstract_id where a.is_demo
union all select 'reviews on test abstracts', count(*)::text from public.reviews r join public.review_assignments ra on ra.id = r.assignment_id join public.abstracts a on a.id = ra.abstract_id where a.is_demo
union all select 'test abstracts in public abstract book (must be 0)', count(*)::text from public.public_abstracts p join public.abstracts a on a.id = p.id where a.is_demo
union all select 'staff roles (organiser / reviewer)', format('%s / %s', count(*) filter (where role = 'organiser'), count(*) filter (where role = 'reviewer')) from public.user_roles
union all select 'highest registration serial', coalesce(max(serial_number), 0)::text from public.registrations
union all select 'highest abstract serial', coalesce(max(serial_number), 0)::text from public.abstracts;
