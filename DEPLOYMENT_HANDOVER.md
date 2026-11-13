# AFDS staging handover — Akure Humboldt Kolleg 2027

## Account permissions blocker

The user's connected Vercel team `fayeun-lawerences-projects` declined both create-project and create-deployment with HTTP 403. The environment has no authenticated Vercel CLI fallback. This is **not deployed** and no public URL is claimed. A separate Supabase project has not been created because the account has three eligible organisations; the intended organisation must be selected explicitly.

## Required user-side account actions

1. In GitHub, create `DrFayeunAgriStats/akure-humboldt-kolleg-2027` (empty repository). Upload these project files or run normal Git push.
2. In Vercel, create/import `akure-humboldt-kolleg-2027` from that repository under an account/team with project creation permission. Choose Next.js framework and set a preview domain.
3. In Supabase, create a *dedicated* `Akure Humboldt Kolleg 2027` project in the desired organisation. Use this project's own credentials. Do not reuse other products' databases.
4. Set Vercel environment variables listed below, run clean database migration and verify security. The preview may be deployed with no Supabase credentials, but all real user workflows will remain inactive.
5. Check the fully sponsored conference banner, theme, 22–25 February 2027 calendar, and five subthemes before sharing a demonstration with the organiser.

## Server configuration

| Variable | Expected value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Actual Vercel URL | For canonical URLs and metadata |
| `NEXT_PUBLIC_EVENT_START` | `2027-02-22T00:00:00+01:00` | WAT countdown |
| `SITE_PUBLIC` | `false` until public launch approved | Site remains noindex while proposed |
| `NEXT_PUBLIC_SUPABASE_URL` | New conference project URL | Public identifier |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | New project's publishable key | Public key, safe in client |
| `REGISTRATION_OPEN` | `false` initially | Set true only after end-to-end validation |
| `SUBMISSIONS_OPEN` | `false` initially | Set true only when approved |
| `RESEND_API_KEY` | Server-only Resend API key | For confirmed notification delivery |
| `CONFERENCE_FROM_EMAIL` | Verified sender address | Set SPF/DKIM |
| `ORGANISER_NOTIFICATION_EMAIL` | Organiser-approved recipient | Optional |

There are **no Paystack or fee-related environment variables**.

## Phase gates

- **Showcase gate:** Homepage, public content, and fictional sample workflows can be demonstrated without a database. The ribbon must say prototype and no live registrations are taken.
- **Staging integration gate:** New database + RLS + Auth callback + email + abstract attachment storage work under dummy accounts.
- **Production gate:** Organiser approvals, secure hosting plan, privacy policy, accepted scientific content, security checks, audit logs, backups, accessible mobile testing, verified sender domain and accurate contact details. Only then activate registrations and submissions.

## No real payments

This event is **fully sponsored**. Attendance and abstract submission are free; do not request bank-card data, issue invoices for delegate attendance, integrate a payment provider, or mark any delegate as unpaid.
