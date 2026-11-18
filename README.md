# Akure Humboldt Kolleg 2027 — Fully Sponsored Conference Platform

Prepared by **Able-Flourish Digital Solutions**. Next.js 16 App Router source based on the approved concept HTML styling, preserving the scientific theme and 22–25 February 2027 dates.

**Important:** The conference is **free / fully sponsored**. There is **no Paystack integration, payment gateway, fee table, payment verification, receipt or payment field**. A participant only needs an account and a free registration reference; abstract submission is optional.

## Current status (November 2026)

The Local Organising Committee has commissioned this as the official conference website. **Official registration has not yet opened.** The participant system runs in *pre-launch test mode* until the reviewed switch in [`docs/LAUNCH_TRANSITION.md`](docs/LAUNCH_TRANSITION.md) is approved and performed.

- **Launch controls live in the database** (`public.conference_settings`). Organisers open or close registration and abstract submission, and set deadlines, from **Organiser control centre → Launch controls**. The same row is enforced by row-level security, so the site and the database cannot disagree.
- **`demo_mode`** decides whether new records are test (`DEMO-` references) or official. Only a database administrator can change it.
- **Reviewer access** is granted and revoked by organisers in the dashboard. A server route calls audited, organiser-only database functions with the organiser's own session. No service-role key is used. After migration `20261118000200`, clients (organisers included) hold only SELECT on `user_roles`, so the audited functions are the only way to change roles.
- **Database tests:** `scripts/test-db.sh` applies every migration to a throwaway local PostgreSQL and runs the security-boundary suite in `supabase/tests/`.

## Local development

1. Install Node.js 22+. Run `npm install` in this directory, then commit the generated lockfile. Runtime package installation was unavailable in the authoring environment because the npm registry could not be reached.
2. Create a **new dedicated Supabase project** specifically for this conference, rather than reusing a live VivaSense, Veterans Bookstock or cooperative database.
3. Copy `.env.example` to `.env.local` and supply the new project's public URL and publishable key. Never commit `.env.local` or a Supabase secret key.
4. Apply `supabase/migrations/20261113000100_initial_conference_schema.sql` **to the new project only**, review the RLS and private bucket, then verify using test users.
5. Configure Supabase Auth magic-link URL to `https://YOUR-STAGING-URL/auth/callback`, turn on email verification and bot protection. Assign the organiser role with a privileged one-time database statement referencing the chosen Auth user ID.
6. Run `npm run typecheck` and `npm run build`, then test locally with `npm run dev` and deploy a preview to Vercel. Use an appropriate commercially licensed hosting plan for a paid AFDS client contract.
7. Open registration and abstract submission from the organiser dashboard's Launch controls only after the checklist in `docs/LAUNCH_TRANSITION.md` has passed.

## URL structure

- `/` — conference landing page, five sub-themes, programme preview, participation and venue.
- `/register` — authenticated **free** registration; no payment fields.
- `/submit` — registered participants submit a 250–300-word abstract with optional private PDF/DOC/DOCX attachment.
- `/login`, `/auth/callback` — magic-link authentication.
- `/dashboard` — participant registration and abstract-status portal.
- `/dashboard/reviewer` — private peer-review recommendations for assigned abstracts.
- `/dashboard/organiser` — organiser dashboard, reviewer assignments, abstract decisions, CSV exports.
- `/speakers`, `/programme` — approved published information only.
- `/abstracts` — only abstracts explicitly accepted AND released for publication.

## Tests to complete before collecting real data

- Confirm new Supabase project and run schema + security advisors.
- Two user accounts cannot access each other's registrations or abstracts.
- Organiser/reviewer staff roles cannot be assigned by normal participants; reviewers see only assigned material.
- Private attachment storage and revocation work; no manuscript is publicly exposed.
- Free registration reference is unique; repeat registration is rejected; confirmation email works; consent is recorded.
- Abstract word limits, file type/size verification and review transitions work under concurrency.
- Dashboard counts, exports, publisher-controlled abstract book and programme are correct.
- Verify mobile layouts, accessibility, SEO, images, privacy notice, availability, error logs, backups and anti-spam controls.

## Publicity and governance

The Kolleg is still **proposed**; confirm host permissions, institutional logos, speakers, dates and location with the organising committee before replacing placeholders. Do not use fictional names or displayed sample statistics as factual reporting. The website is a working bid demonstration and test records are separately flagged. No test records should be treated as official conference applications.

See `DEPLOYMENT_HANDOVER.md` for the fastest staging sequence.
