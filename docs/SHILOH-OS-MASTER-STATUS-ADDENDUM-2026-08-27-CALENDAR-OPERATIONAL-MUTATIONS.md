# Master Status Addendum — Calendar Operational Mutations

Date: 2026-08-27

## Terminal durable state

`SHILOH-CALENDAR-OPERATIONAL-MUTATIONS-P0` is **COMPLETE — MERGED / EXACT-HEAD CI GREEN / AUTHENTICATED BROWSER VERIFIED / PRODUCTION DEPLOY LIVE / HEALTH GREEN.**

Owner: **10 — Calendar & Booking Assurance**  
Control: **00 — Control & Reconciliation**

## Durable authority

- PR #516 — `Calendar: add guarded operational mutations`.
- Final accepted PR head: `0259721712d6b1bfc47a5c37ce801ed98f61a5d2`.
- Final accepted tree: `eaa9da88e5dfb172aef6cbd3e549e48f3188bec7`.
- Authoritative merged application/main SHA: `c68d29ddadca78db98bf544ba804963df8685f4c`.
- Verified-live Render deploy: `dep-da8a5gp5efls73dsig0g`.
- Exact-head CI #1545 / run `33114163521`: **SUCCESS**.
- Authenticated non-production Chromium proof artifact: #9663795180.

## Durable operational outcome

The Shiloh Calendar now has a separate governed operational-mutation capability for the authorized staff operator set, covering:

- appointment reschedule and drag/drop reschedule;
- practitioner reassignment;
- appointment cancellation;
- clinic/practitioner blocks;
- operational leave; and
- working schedules.

This operational capability is intentionally separate from booking-creation service authority. Existing `calendarCreateBooking`, `business_role`, `calendar_scope` and `service_scope` behavior remains unchanged.

## Authority and security invariants

Operational writes remain fail closed and server authoritative.

Every write requires the authenticated staff browser session, same-origin JSON, CSRF, operational capability, revision/idempotency checks, locking, final canonical scheduling validation and attributable audit provenance. Browser or payload actor identity is not authoritative.

Manual reschedule and drag/drop use the same guarded mutation path. Successful mutations reload canonical Calendar state. Cancellation requires deliberate confirmation. Reassignment validates destination service eligibility and availability. Block, leave and schedule changes do not silently move or cancel existing appointments.

Google Calendar is not normal scheduling/availability or mutation authority for this capability.

## Accepted verification

At exact final head `0259721712d6b1bfc47a5c37ce801ed98f61a5d2`:

- full GitHub CI regression: **1,224 / 1,224 PASS**;
- authenticated production-shaped non-production Chromium: **PASS**;
- Christel, Abigail, Marietjie and JP intended operational controls: verified;
- ineligible operator: fail closed with no operational controls/script and capability denial;
- payload impersonation: ignored in favor of authenticated session authority;
- all six mutation families: browser submission verified;
- cancellation decline/acceptance behavior: verified;
- canonical Calendar refresh after mutations: verified;
- Google operational controls/requests: zero;
- Create Booking/service-scope regressions: unchanged and green;
- mobile 44px control targets and zero horizontal overflow: verified.

The browser proof is retained in artifact #9663795180 with an exact-head manifest and six hashed screenshots.

## Production release and proof boundary

00 exercised the ACTIVE bounded operational delegation to merge/release this already-authorized, tested, bounded technical unit after satisfying the exact-head release gates.

Render automatic deploy `dep-da8a5gp5efls73dsig0g` reached **live** on exact merge/main SHA `c68d29ddadca78db98bf544ba804963df8685f4c`.

Post-deploy evidence confirmed normal startup and HTTP 200 at `/health`.

No production appointment, booking, block, leave, schedule, CRM record, Google event, provider configuration or outbound message was mutated for verification. Appointment #592 remained untouched.

A manufactured production mutation is not required for completion. First genuine use by an authorized operator is normal operational observation.

## Stabilization-sequence effect

The Calendar operational-mutations P0 is closed and must no longer consume the active P0 implementation slot absent genuine defect evidence.

The stabilization spine remains:

**Shiloh Calendar → Clean CRM V2 → WhatsApp communications / client registration**

The next major internal priority is **20 — CRM & Identity** for Clean CRM V2 foundation/release and Calendar ↔ CRM V2 integration sequencing.

## Closure

`SHILOH-CALENDAR-OPERATIONAL-MUTATIONS-P0` is **COMPLETE / FROZEN / DO NOT REDO** absent new production defect evidence or a separately authorized controlled unit.
