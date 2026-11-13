# Akure Humboldt Kolleg 2027 — Fully Sponsored Conference Platform

Prepared by **Able-Flourish Digital Solutions**. Next.js 16 App Router source based on the approved concept HTML styling, preserving the scientific theme and 22–25 February 2027 dates.

**Important:** The conference is **free / fully sponsored**. There is **no Paystack integration, payment gateway, fee table, payment verification, receipt or payment field**. A participant only needs an account and a free registration reference; abstract submission is optional.

## Current status

The source is prepared for installation and staging, **not deployed or end-to-end tested**. The connected Vercel plugin does not have access to create this project; use Vercel import for the staging branch. The dedicated Field-to-Insight Supabase project is provisioned and migrations have been applied; live application integration and privacy testing remain pending. The public demo is **fictional and in-memory only**; its forms are not linked to the database.

## Local development

1. Install Node.js 22+. Run `npm install` in this directory, then commit the generated lockfile. Runtime package installation was unavailable in the authoring environment because the npm registry could not be reached.
2. Create a **new dedicated Supabase project** specifically for this conference, rather than reusing a live VivaSense, Veterans Bookstock or cooperative database.
3. Copy `.env.example` to `.env.local` and supply the new project's public URL and publishable key. Never commit `.env.local` or a Supabase secret key.
4. Apply `supabase/migrations/20261113000100_initial_conference_schema.sql` **to the new project only**, review the RLS and private bucket, then verify using test users.
5. Configure Supabase Auth magic-link URL to `https://YOUR-STAGING-URL/auth/callback`, turn on email verification and bot protection. Assign the organiser role with a privileged one-time database statement referencing the chosen Auth user ID.
6. Run `npm run typecheck` and `npm run build`, then test locally with `npm run dev` and deploy a preview to Vercel. Use an appropriate commercially licensed hosting plan for a paid AFDS client contract.
7. Only after privacy consent, organiser content approval, testing, notifications and recovery procedures are in place: set `REGISTRATION_OPEN=true` and `SUBMISSIONS_OPEN=true` for the staging environment; separately approve production rollout.

## URL structure

- `/` — conference landing page, five subthemes, programme preview, fully sponsored banner, **demo-only forms**.
- `/prototype.html` — in-browser concept demonstration, not a live system.
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

The Kolleg is still **proposed**; confirm host permissions, institutional logos, speakers, dates and location with the organising committee before replacing placeholders. Do not use fictional names or displayed sample statistics as factual reporting. The website may be visible to prospective organisers with the demonstration banner; the actual database remains OFF until explicitly activated.

See `DEPLOYMENT_HANDOVER.md` for the fastest staging sequence.
