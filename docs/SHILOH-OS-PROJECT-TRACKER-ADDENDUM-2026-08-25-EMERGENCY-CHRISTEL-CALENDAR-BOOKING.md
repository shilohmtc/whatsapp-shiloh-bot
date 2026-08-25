# Project Tracker Addendum — Emergency Christel Calendar Booking

Date: 2026-08-25

## Controlled unit

`SHILOH-EMERGENCY-CHRISTEL-CALENDAR-BOOKING`

Owner: 10 — Booking & Admin UX
Control: 00 — Control & Reconciliation
Parallel provider track: 30 — WhatsApp & Meta Integration remains separate and is not on the Christel browser-booking critical path.

Status: COMPLETE — MERGED / CI GREEN / VERIFIED LIVE.

## Terminal implementation authority

Control authority remains PR #477 — Authorize emergency Christel Calendar booking path.

Implementation PR: #478 — Complete emergency Christel Calendar booking acceptance proof.
Implementation branch: `feat/emergency-christel-calendar-booking`
Exact final branch head: `738c56157bfdf295503113351bc624b646e757c4`
Authoritative implementation merge/main SHA: `565c7d42887bc6c6f487c806f673b8a2ceaf7ba0`
Exact live Render deploy: `dep-da6h37bm8hqs738lhn60`

## Acceptance evidence

- Bootstrap/security suite: 11/11 passed.
- Booking acceptance tests 11–30: 20/20 passed.
- Full regression: 1038/1038 passed; 0 failed.
- PR CI: run #1405 / `32806750538`, job `97678252705` — SUCCESS.
- Post-merge main CI: run #1406 / `32806829774`, job `97678481722` — SUCCESS.
- Approved-leave parity proved executable through canonical full-day `staff_schedule_exceptions`.
- Stale-slot confirmation revalidates eligibility, clinic schedule, staff schedule, CRM conflicts, shared Google Calendar, and practitioner Google Calendar before appointment insertion.
- Calendar Create Booking continues delegating to canonical CRM lookup and canonical guarded Admin booking.
- Calendar routes retain staff-session, same-origin, and CSRF protection.
- No public Calendar exposure and no global authentication disable.

## Production verification

- Render deploy `dep-da6h37bm8hqs738lhn60` is LIVE at commit `565c7d42887bc6c6f487c806f673b8a2ceaf7ba0`.
- Migration `079_emergency_christel_calendar_bootstrap.sql` checksum verified and applied at startup.
- Google Calendar provider health check passed.
- Application startup succeeded and the new production instance repeatedly returned `/health` HTTP 200.
- No post-deploy error-level logs were found.
- No production bootstrap link was generated for synthetic testing and no production/test appointment was created.

## Residual observation — not a completion gate

Render tooling does not expose environment-variable values through the available read-only path, so no synthetic bootstrap was issued solely to prove runtime flag activation. First genuine Christel operational use is the appropriate runtime observation. This does not reopen implementation and is not a blocker to COMPLETE status.

Meta staff OTP continues independently under 30 and is not a dependency for this completed browser-booking unit.

## Completion

00 — Control & Reconciliation accepts this controlled unit as COMPLETE. Do not reopen, recreate, or redo the completed Booking implementation unless new production evidence establishes a defect or a separately authorized change is created.
