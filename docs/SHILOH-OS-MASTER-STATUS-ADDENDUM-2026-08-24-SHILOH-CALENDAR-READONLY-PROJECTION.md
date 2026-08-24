# Shiloh OS — Master Status Addendum — Shiloh Calendar Read-Only Projection

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Acceptance owner after implementation: **00 — Control & Reconciliation**
Architecture authority: PR #451 / `a329b41a539a73b0fd768f0799eb3a09893ea593`
Control ratification authority: PR #452 / `d7b3d7f3541757e30505e3795c3092daa6f2f0da`
Application implementation authority: PR #453 / **`7ba0b488314fb9f9138043be45192179582e1b41`**
Durable state: **READ-ONLY SCHEDULINGTIMELINE PROJECTION IMPLEMENTED / VERIFIED LIVE**

## Durable implemented state

PR #453 implements the first Control-authorized Shiloh Calendar runtime slice without changing canonical booking mutation authority.

`src/services/schedulingEngine.js` is now the read/delegation facade required by the ratified Calendar architecture. It delegates existing availability computation rather than replacing or forking that algorithm and adds a bounded, permission-filtered `listTimeline({from,to,viewer,staffIds})` read projection.

Shiloh/Postgres remains canonical for scheduling business truth. The projection reads existing authoritative scheduling sources and labels provenance rather than creating a second mutable Calendar source of truth.

Canonical projected sources include:

- `appointments` with authoritative `appointment_staff` allocations and legacy single-staff fallback only where no assignment rows exist;
- `calendar_blocks`;
- staff working hours and recurring staff closures;
- staff schedule exceptions;
- approved staff leave/unavailability;
- active clinic/location working hours and date exceptions;
- South African public holidays where current clinic-hours authority makes them relevant closures.

The projection therefore preserves PR #380 multi-practitioner semantics: a single appointment remains one canonical appointment with all permitted `appointment_staff` assignments rather than being collapsed to one practitioner or duplicated into pseudo-appointments.

## Google Calendar authority

Google Calendar remains mandatory and **non-canonical**.

The new projection calls the existing `googleBookingCalendar.checkCalendarAvailability(...)` owner for permitted practitioners and projects returned provider conflicts only as `external_busy` enrichment with explicit non-canonical provenance.

PR #395 remains the durable conflict-classification authority. Practitioner-tagged external busy remains practitioner-specific; unassigned/shared events remain clinic-wide fail-closed according to the existing classifier. The projection does not reimplement or weaken that classifier.

If Google Calendar is not enabled for the new projection, the projection fails closed with `SCHEDULING_GOOGLE_CALENDAR_REQUIRED`; it does not silently treat Google as optional.

Shared/practitioner Google mirrors remain unchanged and continue under existing booking/runtime authority.

## Permission and mutation boundary

Calendar viewer scope is enforced server-side before timeline projection. Recognized current scopes are `all_business`, `own_services`, `own_appointments` and `none`; unknown/missing scope fails closed, and own-scope viewers are constrained to their canonical staff identity.

The new projection SQL is SELECT-only. PR #453 adds no endpoint or service method for appointment creation, rescheduling, cancellation, drag/drop, schedule changes, block changes, leave changes or Google Calendar mutation.

Existing booking, availability, conflict, approval, provider, audit/history and mirror mutation owners remain authoritative. The Calendar-first product rule ratified by PR #452 remains a **future guarded mutation-phase invariant**, not an authorization to mutate from Calendar now.

## Verification

PR #453 CI run **#1350** / workflow run **32735906492** / job **97458507439** passed on Node **24.14.1**:

- maintenance framework **12/12**;
- focused SchedulingTimeline delegation/parity/no-mutation **6/6**;
- full non-mutating regression **937/937**, 0 failed, 0 skipped;
- npm audit during `npm ci`: **0 vulnerabilities**.

Render auto-deploy **`dep-da64st49v7es73fnf37g`** checked out exact PR #453 merge **`7ba0b488314fb9f9138043be45192179582e1b41`**, built successfully and reached **LIVE**, finished **2026-08-24T14:01:23.053644Z**.

The deployed instance logged **Google Calendar provider health check passed**, logged **Shiloh started**, returned root HTTP 200 and repeatedly returned `/health` HTTP 200 after startup.

No synthetic production scheduling, CRM, WhatsApp or Calendar mutation was used to obtain this proof.

## Authority preserved / do not redo

PR #451 remains the Calendar foundation architecture authority. PR #452 remains the Control ratification and Calendar-first future-product authority. PR #453 is now the durable application authority for the read-only SchedulingTimeline projection. PR #395 remains Google practitioner-conflict classification authority. PR #380 remains multi-practitioner booking/allocation authority.

Do not rewrite availability/conflict algorithms as part of this completed slice. Do not make Google optional, remove mirrors, add Calendar mutations or infer authorization for later phases from this completion.

## Next control decision

The implementation unit is complete and should return to **00 — Control & Reconciliation** for acceptance.

If accepted, the ratified sequence identifies **read-only Day/Week/Agenda Calendar UX** as the next candidate bounded unit, followed by parity/observability hardening and only later separately authorized delegated mutations. This addendum does not itself authorize that next implementation.
