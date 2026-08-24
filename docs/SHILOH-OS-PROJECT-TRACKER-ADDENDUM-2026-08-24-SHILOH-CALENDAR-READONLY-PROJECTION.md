# Shiloh OS — Project Tracker Addendum — Shiloh Calendar Read-Only Projection

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Acceptance owner after completion: **00 — Control & Reconciliation**
State: **🟢 VERIFIED LIVE / COMPLETE — CONTROL ACCEPTANCE NEXT**

## Reconciliation

`SHILOH-CALENDAR-READONLY-PROJECTION` is now **🟢 VERIFIED LIVE / COMPLETE** for implementation under the authority of PR #451 and Control ratification PR #452.

This addendum supersedes only the prior Project Tracker addendum state that described this unit as **AUTHORIZED FOR IMPLEMENTATION**. The Calendar foundation architecture, Calendar-first future product rule, PR #395 Google conflict semantics, PR #380 multi-practitioner semantics and all explicit mutation holds remain unchanged.

## Application authority

PR **#453** merged the bounded read-only SchedulingTimeline implementation as application commit **`7ba0b488314fb9f9138043be45192179582e1b41`**.

Implemented scope:

- `src/services/schedulingEngine.js` is a read/delegation facade, not an availability rewrite;
- `listAvailability(...)` delegates to the existing authoritative Admin availability service;
- permission-filtered, bounded `listTimeline({from,to,viewer,staffIds})` projects canonical scheduling state;
- canonical sources include `appointments` + `appointment_staff`, `calendar_blocks`, staff working hours, recurring staff closures, staff schedule exceptions, approved staff leave, location working hours/exceptions and South African public holidays where current authority supports them;
- appointment projection preserves `appointment_staff` fan-out and therefore PR #380 multi-practitioner semantics;
- Google external-busy is read through the existing Google Calendar availability/conflict owner, preserving PR #395 classification, and is explicitly marked **non-canonical** with provider provenance;
- unknown viewer scope fails closed and own-scope viewers are constrained to their canonical staff identity;
- Google remains mandatory for the new projection and cannot silently become optional;
- projection SQL is SELECT-only and the new service exposes no Calendar/booking/schedule/block/leave mutation path.

## Verification evidence

PR #453 CI workflow run **#1350** / run **32735906492** / job **97458507439** passed on Node **24.14.1**.

- focused maintenance-framework tests: **12/12 passed**;
- focused SchedulingTimeline parity/no-mutation tests: **6/6 passed**;
- full non-mutating regression suite: **937/937 passed**, 0 failed, 0 skipped;
- `npm ci` audited 175 packages with **0 vulnerabilities**.

Render auto-deploy **`dep-da64st49v7es73fnf37g`** checked out exact merge **`7ba0b488314fb9f9138043be45192179582e1b41`**, built successfully and reached **LIVE**, finishing **2026-08-24T14:01:23.053644Z**.

The new production instance logged **Google Calendar provider health check passed**, then **Shiloh started**, and repeatedly returned `/health` HTTP **200** after startup. Root `HEAD /` also returned HTTP 200.

No real appointment, schedule, block, leave, CRM record, WhatsApp message or Google Calendar event was created/rescheduled/cancelled/deleted for proof.

## Holds preserved

Still **not authorized**:

- Calendar-native booking creation or other booking mutation;
- Calendar reschedule/cancellation mutation;
- drag/drop mutation;
- schedule/block/leave writes;
- weakening Google conflict authority;
- removing Google mirrors;
- bidirectional Google appointment authority;
- making Google Calendar optional.

## Next checkpoint

Owner: **00 — Control & Reconciliation**.

Control should accept or reject the completed read-only projection/parity evidence and decide the next bounded Calendar unit. Under the ratified sequence, the next candidate is read-only Day/Week/Agenda Calendar UX; it is **not** authorized by this implementation completion alone.
