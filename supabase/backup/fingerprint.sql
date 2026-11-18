-- READ-ONLY data fingerprint of the nine conference tables (row count and a hash of
-- every row's contents). Creates nothing and changes nothing; safe on live.
-- Run it when taking a backup, save the single output value, and compare it with the
-- same query on the restored copy (scripts/verify-backup.sh does this automatically).
-- Note: Storage files (abstract attachments) are not database rows and are not
-- covered; see docs/PRODUCTION_INTEGRATION.md for how they are handled.
select string_agg(
         t || ':' || (xpath('/row/c/text()', x))[1]::text || ':' || (xpath('/row/h/text()', x))[1]::text,
         E'\n' order by t) as fingerprint
from unnest(array['abstracts','conference_settings','public_abstracts','registrations','review_assignments',
                  'reviews','sessions','speakers','user_roles']) as t,
     lateral query_to_xml(
       format('select count(*) as c, md5(coalesce(string_agg(r::text, ''|'' order by r::text), '''')) as h from public.%I r', t),
       false, true, '') as x;
