-- Representative pre-launch test data (LOCAL TESTING ONLY) for the backup and release
-- rehearsal: users, staff roles, test registrations, abstracts, an assignment, a review,
-- a speaker and a session. Inserted as the database owner (as existing live data was).
insert into auth.users(id, email) values
  ('20000000-0000-0000-0000-00000000000a', 'org.sample@sample.test'),
  ('20000000-0000-0000-0000-00000000000b', 'author.one@sample.test'),
  ('20000000-0000-0000-0000-00000000000c', 'author.two@sample.test'),
  ('20000000-0000-0000-0000-00000000000d', 'reviewer.sample@sample.test');
insert into public.user_roles(user_id, role) values
  ('20000000-0000-0000-0000-00000000000a', 'organiser'), ('20000000-0000-0000-0000-00000000000d', 'reviewer');
update public.conference_settings set demo_mode = true, registration_open = true, submissions_open = true where id = 1;
insert into public.registrations(user_id,email,full_name,institution,country,city,phone,humboldt_status,german_fellowship,submitting_abstract,category,consent_data,consent_media,is_demo) values
  ('20000000-0000-0000-0000-00000000000b','author.one@sample.test','Adaeze Sample','University of Ibadan','Nigeria','Ibadan',null,'humboldtian',true,true,'academic',true,true,true),
  ('20000000-0000-0000-0000-00000000000c','author.two@sample.test','Tunde Sample','FUTA','Nigeria',null,'+2348000000000','non-humboldtian',false,true,'student',true,false,true);
insert into public.abstracts(registration_id,user_id,author_name,email,institution,title,body,track,presentation_type,keywords,file_path,is_demo)
select r.id, r.user_id, r.full_name, r.email, r.institution, 'Sample abstract by ' || r.full_name,
       (select string_agg('word' || g, ' ') from generate_series(1, 270) g), 1 + (row_number() over (order by r.email))::int,
       'oral', array['soil','carbon'], case when r.email like 'author.one%' then r.user_id || '/sample.pdf' end, true
from public.registrations r;
insert into public.review_assignments(abstract_id, reviewer_id)
  select id, '20000000-0000-0000-0000-00000000000d' from public.abstracts where email = 'author.one@sample.test';
insert into public.reviews(assignment_id, reviewer_id, relevance, rigour, clarity, impact, recommendation, comments)
  select id, reviewer_id, 4, 3, 4, 4, 'revise', 'Sample review comment for the rehearsal.' from public.review_assignments;
insert into public.speakers(name, institution, talk_title, short_bio, published, sort_order)
  values ('Sample Speaker', 'FUTA', 'Sample keynote', 'Sample biography.', false, 1);
insert into public.sessions(title, description, starts_at, ends_at, room, session_type, published)
  values ('Sample opening session', 'Sample.', '2027-02-22T09:00:00+01', '2027-02-22T10:00:00+01', null, 'keynote', false);
