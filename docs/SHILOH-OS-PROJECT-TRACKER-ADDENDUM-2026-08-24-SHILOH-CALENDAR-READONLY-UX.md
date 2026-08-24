# Shiloh OS — Project Tracker Addendum — Shiloh Calendar Read-Only UX

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Acceptance / dependency-routing owner after completion: **00 — Control & Reconciliation**
State: **🟢 IMPLEMENTATION VERIFIED LIVE / COMPLETE — 🟠 SECURE BROWSER ACCESS HELD**

## Reconciliation

`SHILOH-CALENDAR-READONLY-UX` is implementation-complete under Control authorization PR #455.

This addendum supersedes only the prior Project Tracker addendum state that described the unit as **AUTHORIZED FOR IMPLEMENTATION NOW**. `SHILOH-CALENDAR-READONLY-PROJECTION` remains **VERIFIED LIVE / CONTROL ACCEPTED / COMPLETE / DO NOT REDO**.

## Application authority

PR **#456 — Build read-only Shiloh Calendar Day Week Agenda UX** merged as application commit **`533907a704e29106ef67852ddedd800164521cc5`**.

The implementation adds a lightweight server-rendered Shiloh Calendar experience mounted separately at `/calendar/read-only` and consuming the accepted SchedulingTimeline only through the thin `calendarReadOnlyUx` server adapter over `schedulingEngine.listTimeline(...)`.

Implemented read-only views and controls:

- **Day** — practitioner lanes, effective working-time context, canonical appointments, blocks, approved leave/unavailability, closures/holidays and visibly differentiated Google-only busy;
- **Week** — compact seven-day practitioner-aware operational view over the same SchedulingTimeline truth;
- **Agenda** — chronological seven-day scan optimized for narrower screens;
- Today, previous/next period, Day/Week/Agenda switching and practitioner filtering limited to staff already permitted by the server-authorized SchedulingTimeline;
- explicit canonical/non-canonical provenance;
- explicit unavailable/fail-closed presentation when SchedulingTimeline or required Google Calendar authority is unavailable.

PR #380 multi-practitioner semantics remain authoritative: one appointment with multiple `appointment_staff` assignments is rendered as **one canonical shared appointment**, not duplicated into pseudo-appointments. PR #395 remains the Google practitioner/shared conflict-classification authority; Google-only busy is rendered as non-canonical provider state.

## Security / production access gate

Current Shiloh still has no proven browser-safe staff/Admin login/session boundary. The existing `/admin` HTTP API remains protected by the shared server secret `ADMIN_API_KEY` through `x-admin-key`; that credential is **not** used by the Calendar browser surface.

PR #456 therefore deliberately keeps production Calendar access fail-closed:

- `SHILOH_CALENDAR_READONLY_UX_ENABLED` is **default-off** in code;
- with the feature gate off, `/calendar/read-only` returns 404 before SchedulingTimeline is called;
- even if the gate is later enabled, SchedulingTimeline is not called unless a trusted server component attaches authenticated viewer context using `Symbol.for('shiloh.calendar.server.viewer')` with source `server_staff_session`;
- browser query/header values cannot supply `calendarScope` or staff authorization;
- `ADMIN_API_KEY` is never embedded in HTML/JavaScript, browser storage, cookies or query parameters;
- response headers are no-store, no-referrer, frame-deny and restrictive CSP;
- the new route has GET-only navigation and exposes no mutation endpoint/control.

No current production middleware establishes that server staff-session viewer context. Therefore the UX code is deployed, but **no staff member is yet authorized to use the real scheduling-data browser view in production**. This is intentional and is now a separate secure-access dependency for Control to route.

Existing `/calendar/:token.ics` appointment-share/export behavior is preserved as a separate route and was not repurposed.

## Verification evidence

PR #456 CI workflow run **#1356** / run **32738644960** / job **97467479413** passed on Node **24.14.1**.

- maintenance framework: **12/12 passed**;
- SchedulingTimeline parity: **6/6 passed**;
- focused Calendar UX security/no-mutation suite: **8/8 passed**;
- full non-mutating regression: **945/945 passed**, 0 failed, 0 cancelled, 0 skipped;
- `npm ci`: 174 packages installed, 175 audited, **0 vulnerabilities**.

Render auto-deploy **`dep-da659kqd0e5s73c6h780`** checked out exact application merge **`533907a704e29106ef67852ddedd800164521cc5`**, built successfully and reached **LIVE**, finishing **2026-08-24T14:28:12.143915Z**.

The new production instance `srv-d9qbfmk9v7es73emgam0-hf282` logged **Google Calendar provider health check passed**, logged **Shiloh started**, returned root HTTP 200 and repeatedly returned `/health` HTTP 200 after startup/cutover.

No appointment, schedule, block, leave, CRM record, WhatsApp message or Google Calendar event was created/rescheduled/cancelled/deleted for proof. No Calendar activation environment mutation was performed by this unit.

## Still not authorized

Calendar booking creation, reschedule, cancellation, drag/drop, practitioner/service reassignment, schedule/block/leave writes, Google writes, reduced Google conflict authority, mirror removal, bidirectional Google appointment authority and Google optionality remain prohibited pending later separate Control authority.

## Next checkpoint

Owner: **00 — Control & Reconciliation**.

Control should accept/freeze the completed read-only UX implementation and route the remaining secure browser staff identity/session dependency. Only after a browser-safe server-side staff/Admin authentication boundary exists and is separately authorized should Control decide whether to activate the read-only Calendar for genuine staff production use.
