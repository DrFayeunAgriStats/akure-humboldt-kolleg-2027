# Implementation status (17 November 2026)

| Component | Status |
|---|---|
| Public site: homepage, programme, speakers, abstract book, privacy | Live in source; homepage redesign pending LOC concept choice |
| Registration and abstract submission (free, private attachments) | Working; currently in pre-launch test mode |
| Launch controls (open/close, deadlines) | Organiser dashboard; enforced by database RLS |
| Peer review (blind), reviewer administration, decisions, exports | Working; reviewer grants via audited database functions |
| Demo → official transition | Prepared and rehearsed locally (`docs/LAUNCH_TRANSITION.md`); awaiting LOC decision |
| Database migrations | Reproducible; security suite in `supabase/tests/` (`scripts/test-db.sh`) |
| Payment | None — the Kolleg is fully sponsored |
