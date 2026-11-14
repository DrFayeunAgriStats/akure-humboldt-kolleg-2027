# Bid demonstration rollout / reset record

The conference application is an **interactive bid demonstration**, not an official conference registration site. Until the organisers approve the live call, the source constant `BID_DEMO_MODE` is `true` and the database row `public.conference_settings.demo_mode` must be `true`.

## Demonstration
- Real Supabase magic-link sign-in and row-level security; role checks are retained for reviewer/organiser.
- Registration and abstract APIs accept authenticated trial records and mark `is_demo = true`.
- Demo references begin `DEMO-AKH-`. Trial submissions are not official and can be deleted.
- Publicly display a demonstration/privacy notice. Tell testers not to upload unpublished research. Private attachment storage remains private.
- `public/prototype.html` remains a browser-only guided demo for viewers without author accounts.

## Before the official launch
1. Export a secure, authorised backup, then approve cleanup with the organising committee.
2. Remove demo attachments from private Storage and any public demonstration abstracts.
3. Delete only records marked `is_demo = true`, in referential order (reviews, review_assignments, abstracts, registrations). Delete demo-only auth accounts only with explicit approval, and revoke their sessions.
4. Set `BID_DEMO_MODE = false` in source code, deploy it and verify. Set `conference_settings.demo_mode = false` with registration/submission gates closed while testing.
5. Review the final privacy notice, dedicated contact address, programme, allowed Auth redirect URLs, SMTP and abuse/rate limiting.
6. Open the official `registration_open` and `submissions_open` database flags and application environment switches only after live acceptance tests.

**No automated destructive reset is provided**: never run a blanket `DELETE FROM` or truncate the project in response to a routine website release.
