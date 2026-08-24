# Shiloh OS — Booking & Admin UX — Shiloh Calendar Read-Only Projection Completion

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Acceptance owner: **00 — Control & Reconciliation**
Authorized by: PR #451 foundation architecture + PR #452 Control ratification
Status: **IMPLEMENTED / TESTED / MERGED / VERIFIED LIVE / RECONCILED FOR CONTROL ACCEPTANCE**

## Controlled unit

`SHILOH-CALENDAR-READONLY-PROJECTION`

Control independently established that the earlier attempt had left no implementation PR, branch, recoverable implementation commit or partial production deployment. Implementation therefore resumed from exact authoritative main **`d7b3d7f3541757e30505e3795c3092daa6f2f0da`** without redoing the already-ratified architecture/design discovery.

## Implementation

Bounded implementation branch: `feat/shiloh-calendar-readonly-projection`.

Application PR: **#453 — Implement read-only Shiloh SchedulingTimeline projection**.

Application merge: **`7ba0b488314fb9f9138043be45192179582e1b41`**.

PR #453 added:

- `src/services/schedulingEngine.js`;
- `tests/scheduling-engine-readonly-projection.test.js`;
- a focused SchedulingTimeline parity/no-mutation CI step before the full regression suite.

The scheduling facade deliberately delegates rather than rewrites existing scheduling authority:

- `listAvailability(...)` delegates to the current authoritative Admin availability service;
- `listTimeline({from,to,viewer,staffIds})` is bounded to a 31-day read window and applies viewer/staff scope before projection;
- missing/unknown viewer scope fails closed;
- own-scope Calendar viewers are limited to their canonical staff identity;
- projection SQL is SELECT-only.

## Canonical projection

The read projection composes existing canonical relational authority from:

- `appointments`;
- `appointment_staff`;
- `calendar_blocks`;
- `staff_working_hours`;
- `staff_recurring_day_closures`;
- `staff_schedule_exceptions`;
- approved `staff_leave_requests`;
- `location_working_hours`;
- `location_hours_exceptions`;
- South African `public_holidays` where existing clinic-hours authority supports closure projection.

Projected records carry source provenance and canonical/non-canonical distinction.

The appointment projection preserves the PR #380 model: one appointment may retain multiple authoritative `appointment_staff` allocations. It uses the legacy appointment staff pointer only when no assignment rows exist, matching the existing compatibility boundary rather than replacing multi-practitioner authority.

## Google Calendar parity

Google external-busy remains explicitly **non-canonical**.

The projection calls the existing `googleBookingCalendar.checkCalendarAvailability(...)` read owner for each permitted staff member. It therefore consumes rather than reimplements PR #395 conflict classification.

Focused parity proves:

- an unassigned/shared Google event remains clinic-wide and applies to both practitioners;
- a practitioner-tagged Google event applies only to the matching practitioner;
- projected Google busy records are `canonical=false`, source `google_calendar`, with provenance naming PR #395 classification authority.

The new projection also fails closed when Google is disabled (`SCHEDULING_GOOGLE_CALENDAR_REQUIRED`). PR #453 does not make Google optional, remove mirrors or reduce existing provider authority.

## Deterministic tests

PR #453 CI workflow run: **#1350**.

Workflow run ID: **32735906492**.

Job ID: **97458507439**.

Environment: Node **24.14.1**.

Results:

- focused maintenance framework: **12/12 passed**;
- focused SchedulingTimeline delegation/parity/no-mutation suite: **6/6 passed**;
- full `npm test`: **937/937 passed**, 0 failed, 0 skipped;
- `npm ci`: 174 packages installed, 175 audited, **0 vulnerabilities**.

The focused SchedulingTimeline suite covers:

1. unchanged delegation to existing availability authority;
2. single-practitioner `appointment_staff` projection plus SELECT-only/no-mutation assertions;
3. PR #380 multi-practitioner fan-out without collapsing one appointment;
4. PR #395 Google conflict-classification parity using the actual current classifier;
5. viewer-scope fail-closed behavior and own-scope staff filtering;
6. mandatory Google authority for the new projection.

## Production verification

Render service: `whatsapp-shiloh-bot` / **`srv-d9qbfmk9v7es73emgam0`**.

Auto-deploy: **`dep-da64st49v7es73fnf37g`**.

Trigger: `new_commit` — no manual duplicate deploy was triggered.

Render checked out exact application merge **`7ba0b488314fb9f9138043be45192179582e1b41`** on `main` and used Node **24.14.1**.

Build result: successful; `npm ci` audited 175 packages with **0 vulnerabilities**.

Deploy reached **LIVE**, finished **2026-08-24T14:01:23.053644Z**.

New-instance production evidence:

- **Google Calendar provider health check passed** at approximately `2026-08-24T14:01:12.903Z`;
- **Shiloh started** at approximately `2026-08-24T14:01:12.961Z`;
- root `HEAD /` returned HTTP **200**;
- the new instance `srv-d9qbfmk9v7es73emgam0-k8lcp` repeatedly returned `GET /health` HTTP **200** after startup, including at `2026-08-24T14:01:22.196Z` and subsequent health probes.

No real WhatsApp journey or production booking was manufactured because the authorized slice is a service-layer read projection rather than a public Calendar UI endpoint. No appointment, schedule, block, leave, CRM record, message or Google Calendar event was created/rescheduled/cancelled/deleted for proof.

## Explicitly unchanged

This unit does **not** authorize or implement:

- Calendar booking creation;
- Calendar reschedule/cancellation;
- drag/drop mutation;
- schedule/block/leave mutation;
- a replacement availability/conflict algorithm;
- weaker Google conflict authority;
- Google mirror removal;
- bidirectional Google appointment authority;
- Google optionality.

PR #451 remains the foundation architecture. PR #452 remains Control ratification and Calendar-first future-product authority. PR #395 remains Google practitioner-conflict classification authority. PR #380 remains multi-practitioner booking/allocation authority. PR #453 is the durable application authority for the completed read-only projection.

## Ledger reconciliation

Project Tracker reconciliation is recorded in `docs/SHILOH-OS-PROJECT-TRACKER-ADDENDUM-2026-08-24-SHILOH-CALENDAR-READONLY-PROJECTION.md` and supersedes only the prior #452 addendum state that said this unit was authorized/pending implementation.

Master Status reconciliation is recorded in `docs/SHILOH-OS-MASTER-STATUS-ADDENDUM-2026-08-24-SHILOH-CALENDAR-READONLY-PROJECTION.md` and records PR #453 as durable read-only SchedulingTimeline application authority while preserving all mutation holds.

## Recommendation and next owner

Recommendation: **accept and freeze this read-only slice now**. If Shiloh OS were my project, I would not broaden #453 into Calendar mutations or a new scheduling algorithm. The implementation has established the required read boundary and parity evidence with materially lower risk than combining read and write migration.

Next owner: **00 — Control & Reconciliation**.

Control should accept/reject this parity evidence and choose the next bounded Calendar unit. Under the ratified sequence, the next candidate is read-only Day/Week/Agenda Calendar UX, followed by parity/observability hardening; guarded delegated mutations remain a later separately authorized phase.
