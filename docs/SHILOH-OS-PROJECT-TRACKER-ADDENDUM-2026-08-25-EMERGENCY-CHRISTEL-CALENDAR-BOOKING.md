# Project Tracker Addendum — Emergency Christel Calendar Booking

Date: 2026-08-25

## Controlled unit

`SHILOH-EMERGENCY-CHRISTEL-CALENDAR-BOOKING`

Owner: 10 — Booking & Admin UX
Control: 00 — Control & Reconciliation
Parallel provider track: 30 — WhatsApp & Meta Integration remains separate and is not on the Christel browser-booking critical path.

Status: COMPLETE — GENUINE PRODUCTION ACCEPTANCE PASSED / DO NOT REOPEN.

## Final authority chain

Control authority: PR #477 — Authorize emergency Christel Calendar booking path.
Original bounded implementation: PR #478 — Complete emergency Christel Calendar booking acceptance proof.

Subsequent genuine-production repair chain:
- PR #480 — browser-session viewer-scope compatibility bridge;
- PR #481 — canonical `appointment_staff` SchedulingTimeline projection;
- PR #482 — canonical `calendar_blocks` SchedulingTimeline projection;
- PR #484 — complete SchedulingTimeline production-schema contract repair.

Final repair branch head: `2891ac9ee3f7891f946c0e2b560decd2867b7072`.
Authoritative application/main SHA after PR #484: `d92cf4f725435f47bc9ef6528220c0b7ddaa9edb`.
Exact genuine-acceptance Render deploy: `dep-da6i4m3l550s73blai60` — LIVE.

The earlier PR #479 reconciliation remains historical evidence of the original bounded implementation completion. The production defects discovered only through genuine use were repaired under PRs #480/#481/#482/#484 and are now included in this terminal completion state.

## Final executable evidence

- SchedulingTimeline production-schema contract: 7/7 passed.
- Emergency bootstrap security: 11/11 passed.
- Emergency booking acceptance: 20/20 passed.
- Full regression: 1047/1047 passed; 0 failed.
- PR #484 exact-head CI: run `32811293866`, job `97690986311` — SUCCESS.
- Post-merge main CI: run `32811395578`, job `97691268462` — SUCCESS.

## Genuine production acceptance

The controlled path has now been exercised genuinely in production without creating an appointment:

1. Christel sent `Open Calendar` from her authenticated Shiloh Admin WhatsApp identity.
2. The secure one-time bootstrap exchange returned HTTP 200.
3. The authenticated Calendar request subsequently returned HTTP 200.
4. Shiloh Calendar rendered the canonical read-only timeline and real appointments.
5. `Create booking` was visible only in the authorized Christel session.
6. Christel opened `Create booking`.
7. The genuine production Create Booking screen rendered successfully with date, start time, canonical CRM client lookup, treatment, eligible practitioner, and guarded `Review booking` controls.
8. No error-level logs occurred during the Create Booking presentation proof.
9. No synthetic or real appointment was created, prepared, reviewed, or confirmed during acceptance.

Render independently confirms deploy `dep-da6i4m3l550s73blai60` is LIVE at commit `d92cf4f725435f47bc9ef6528220c0b7ddaa9edb`.

## Preserved safeguards

- Calendar remains private and authentication remains mandatory.
- Christel-only emergency pilot boundary remains intact.
- Meta staff OTP remains outside this capability's critical path.
- SchedulingTimeline remains fail-closed.
- Canonical `appointment_staff`, `calendar_blocks`, staff schedule exceptions, and Google Calendar safeguards remain authoritative.
- Approved leave remains single-source through canonical `staff_schedule_exceptions`.
- Booking writes remain exclusively through the existing guarded canonical Admin booking engine.
- Stale-slot, practitioner/service eligibility, clinic schedule, staff schedule, CRM conflict, shared Google Calendar, and practitioner Google Calendar revalidation remain intact.
- No public Calendar exposure, global authentication disable, or second booking authority was introduced.

## Completion guard

00 — Control & Reconciliation accepts `SHILOH-EMERGENCY-CHRISTEL-CALENDAR-BOOKING` as COMPLETE.

Do not reopen, recreate, or redo the emergency Calendar implementation or the production repair chain absent new defect evidence or a separately authorized controlled unit.

Any later mobile Calendar layout or presentation polish is a separate, lower-priority 10 — Booking & Admin UX unit and is not a blocker to this completion.
