# Akure Humboldt Kolleg 2027 — Activate staging integration

## Verified before opening registration
- GitHub staging branch: `feature/nextjs-conference-platform`
- CI: TypeScript + Next.js build passed for commit `4147f999`
- Supabase project: Field-to-Insight / `vfihhakkeoaskfumgsbw`
- Supabase schema: nine public conference tables, all RLS enabled; private `abstract-files` storage bucket
- Supabase `conference_settings`: `registration_open=false`, `submissions_open=false`
- All attendance and abstracts are **free**. No Paystack, payment fields or transaction workflow.

## Vercel staging environment variables

Open the selected Akure Humboldt Kolleg project in Vercel. Under Settings → Environment Variables, set:

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vfihhakkeoaskfumgsbw.supabase.co` | Public Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Copy the **publishable key** from the Field-to-Insight Supabase project's API Keys page | Safe for client code; **never** use the service/secret key here |
| `NEXT_PUBLIC_SITE_URL` | The real deployed HTTPS preview origin | Used for metadata/canonical URLs |
| `NEXT_PUBLIC_EVENT_START` | `2027-02-22T00:00:00+01:00` | Conference start in Nigeria (WAT) |
| `SITE_PUBLIC` | `false` | Keep preview noindex |
| `REGISTRATION_OPEN` | `false` | Keep closed until QA and organiser consent |
| `SUBMISSIONS_OPEN` | `false` | Keep closed until QA and organiser consent |

Optional, server-side only: `RESEND_API_KEY`, `CONFERENCE_FROM_EMAIL`, `ORGANISER_NOTIFICATION_EMAIL`. Confirmation emails from Resend need a verified domain. Supabase authentication emails are configured independently.

Deploy the **feature branch** as a Vercel preview. After changing environment variables, redeploy preview to apply them.

## Supabase Auth settings

Under Authentication → URL Configuration:
- Set the appropriate production Site URL after official launch.
- Add `https://YOUR-PREVIEW-DOMAIN/auth/callback` to the allowed Redirect URLs.
- Enable email confirmation, rate limits, and a CAPTCHA when inviting testers.

## Acceptance testing

1. Check mobile and desktop public homepage, five tracks, dates, location and the two rainforest images.
2. Login by magic link with an intentionally created test email; check the browser returns to `/dashboard`.
3. For controlled staging tests, enable registration in the **preview environment only**, then verify the first free registration produces a real `AKH-2027-...` reference and is visible only to its owner.
4. Repeat with a second independent test participant and verify cross-user isolation.
5. Test 250/300-word boundary conditions, an optional PDF/DOCX file and `AKH-ABS-...` reference.
6. Assign organiser/reviewer roles to known test Auth users via an authorised database administrator action; verify only assigned reviewer can read the abstract, review does not imply acceptance, and only organiser can publish approved abstracts.
7. Check program, speakers, abstracts book, exports and email delivery; run Supabase Security Advisor.
8. Reclose preview submissions after testing. **Do not** merge into main until sign-off.

## Access limitation

The connected Vercel plugin does not expose the newly imported Akure Vercel projects; this is an account connection/permissions issue, not a build failure. GitHub commit status indicates that Vercel builds ran, but the actual preview hostname must be copied from your Vercel project dashboard and verified in a browser.
