# Shiloh OS Control Reconciliation — Emergency Christel Calendar Booking Authorization

Date: 2026-08-25
Owner: 00 — Control & Reconciliation
Implementation owner: 10 — Booking & Admin UX
Provider/WhatsApp support: 30 — WhatsApp & Meta Integration only where needed
Production activation support: 40 — Production & DevOps only after implementation acceptance

## Decision

JP requires high-throughput browser Calendar booking for Christel now. The existing WhatsApp Admin booking bridge is operational but is not adequate for the current booking volume.

Control does NOT authorize a public or unauthenticated Calendar. The current `/calendar/read-only` route is GET-only and has no booking mutation surface, so disabling authentication alone would weaken security without enabling bookings.

Control therefore authorizes the emergency controlled unit:

`SHILOH-EMERGENCY-CHRISTEL-CALENDAR-BOOKING`

Priority: HIGHEST CURRENT SHILOH OS DELIVERY PRIORITY.

Meta staff-OTP remediation continues in parallel and is no longer a prerequisite for this unit.

## Required outcome

Deliver a production browser Calendar workflow that allows Christel to create real client bookings for eligible Christel and Abigail services through the existing canonical Shiloh booking engine.

## Temporary browser access architecture

Preferred emergency access path:

1. Christel initiates from her existing canonical authenticated Shiloh Admin WhatsApp identity.
2. Shiloh creates a short-lived, high-entropy, single-use browser bootstrap bound server-side to Christel's canonical `staff_admin_accounts.id = 2`.
3. The bootstrap exchanges into the existing opaque server-side staff browser session architecture.
4. The browser session retains existing cookie/CSRF/expiry/rotation/revocation/current-authority safeguards.
5. Browser claims must never establish identity, practitioner scope, business scope or booking authority.
6. The bootstrap must not expose ADMIN_API_KEY or create a clinic-wide bypass.
7. Token/code material must not be persisted in URLs, logs, GitHub, Tracker, Master or long-lived browser storage. If a URL handoff is used, use a design that prevents token leakage through request logs/referrers and invalidates immediately after exchange.
8. Fail closed for any sender other than the exact current canonical Christel Admin account.

This is an emergency bootstrap path, not permission to disable authentication globally.

## Calendar Create Booking authority

The unit is authorized to add the minimum browser booking surface required for operational throughput:

- create booking only;
- choose/search canonical client;
- choose eligible service;
- choose Christel or Abigail only where canonical entitlement permits;
- choose only authoritative available time;
- review before commit;
- create through the existing canonical guarded appointment owner;
- immediately render the committed booking in the same SchedulingTimeline/Calendar.

The browser path must reuse existing guards for:

- canonical Admin authority;
- `appointment:create` and current booking entitlement;
- practitioner/service mappings and client-bookable state;
- clinic/practitioner working hours;
- closures/exceptions;
- blocks and leave;
- existing Shiloh appointments;
- Google conflict classification from PR #395;
- CRM identity/client selection rules;
- appointment/provider/approval safeguards already owned by the canonical booking engine;
- `appointment_staff` canonical practitioner assignment.

Explicit acceptance targets:

- Christel can create an eligible booking for herself;
- Christel can create an eligible booking with Abigail;
- ineligible practitioner/service combinations fail closed;
- conflicts/unavailable times fail closed;
- successful booking appears immediately in SchedulingTimeline;
- no duplicate mutable Calendar store is introduced.

## Scope exclusions

Still NOT authorized in this unit:

- unauthenticated/public Calendar access;
- broad staff rollout;
- reschedule;
- cancel;
- drag/drop;
- practitioner/service reassignment after booking;
- schedule/block/leave/closure writes;
- Google Calendar authority reduction/removal/optionality;
- weakening canonical booking guards;
- changing Meta token scopes, roles, WABA ownership or asset permissions;
- another Meta staff-OTP template/challenge attempt merely to unblock this emergency path.

## Completion protocol

10 must inspect exact current main, implement the emergency bootstrap plus Create Booking slice, add focused security/booking tests, run all existing Calendar/session/booking focused suites and full non-mutating regression, repair until green, open PR, pass CI, merge, verify exact Render deployment, verify provider/startup/HTTP health and bounded errors, then reconcile Project Tracker and Master Status and return to 00.

Production activation is permitted only after the merged implementation proves the emergency bootstrap is bound to Christel's exact canonical Admin account and the booking mutation path is guarded as above.

No real booking should be created merely for proof unless JP/Christel deliberately chooses a genuine client booking. No dummy production appointments.

## Recommendation

Do this now. Do not wait for Meta staff-login convergence. Meta work continues in parallel. The target permanent operating model remains Calendar-first; this emergency path is intended to accelerate that target safely rather than create another parallel booking system.
