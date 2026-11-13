# Implementation status — Free conference revision (13 November 2026)

| Component | Status |
|---|---|
| Original homepage styling and five scientific subthemes | Retained in project source |
| WAT countdown to 22 February 2027 | Implemented in HTML demo and configured for Next.js |
| Public registration demo and free-attendance tab | Implemented in static HTML; fictional only |
| Payment processing | **Removed** — conference fully sponsored, no attendee fees |
| Private free registration API and database | Source prepared; no dedicated live DB or runtime validation |
| Abstract submission 250–300 words and private attachment | Source prepared; not connected or end-to-end tested |
| Reviewer/organiser dashboards | Source prepared; role-based authorisation not runtime-validated |
| Approved public abstract book and published programme | Source prepared; contents awaiting organiser |
| HTML/TypeScript syntax | HTML anchors and tabs checked; TypeScript transpile checks pending at handover |
| Production build | Not run: npm registry unreachable in authoring environment |
| Staging Vercel | **Not deployed** — permission HTTP 403 |
| Real registration and submission | **Closed by default**, intentionally safe |

**Outstanding:** create project accounts with permissions; install/build; apply and test schema/RLS; configure email, domain, confirmed conference content and privacy; security/accessibility/mobile tests; activate registration only after approval.

The supplied files are a release candidate for **staging engineering**, not proof of a live production system.
