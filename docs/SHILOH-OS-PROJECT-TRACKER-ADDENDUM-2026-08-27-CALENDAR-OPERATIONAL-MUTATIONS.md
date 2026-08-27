# Project Tracker Addendum — Calendar Operational Mutations

Date: 2026-08-27

## Controlled unit

`SHILOH-CALENDAR-OPERATIONAL-MUTATIONS-P0`

Owner: **10 — Calendar & Booking Assurance**  
Control: **00 — Control & Reconciliation**  
Execution package: **WS-10 — Calendar Operational Mutations P0**

Status: **COMPLETE — MERGED / EXACT-HEAD CI GREEN / AUTHENTICATED BROWSER VERIFIED / PRODUCTION DEPLOY LIVE / HEALTH GREEN.**

## Purpose

Complete the minimum operational mutation layer around the already-live Shiloh Calendar booking surface without broadening the frozen Create Booking entitlement model.

The unit adds governed Calendar operations for authorized staff while keeping Shiloh Calendar as the canonical scheduling authority and keeping Google out of normal availability and mutation authority.

## Terminal implementation authority

- PR #516 — `Calendar: add guarded operational mutations`.
- Implementation branch: `ws-10-calendar-operational-mutations-p0`.
- Original runtime implementation head: `0447ce335d0bb0340d696bd235474b536333a97d`.
- Final accepted PR head: `0259721712d6b1bfc47a5c37ce801ed98f61a5d2`.
- Final accepted tree: `eaa9da88e5dfb172aef6cbd3e549e48f3188bec7`.
- Authoritative merged application/main SHA: `c68d29ddadca78db98bf544ba804963df8685f4c`.
- Verified-live Render deploy: `dep-da8a5gp5efls73dsig0g`.

The final two commits after the runtime implementation changed only exact-head browser-proof/CI evidence. They did not alter the runtime operational-mutation implementation.

## Functional contract

The separate fail-closed Calendar operational-mutation capability governs:

- appointment reschedule;
- drag/drop reschedule through the same authoritative reschedule path;
- practitioner reassignment;
- appointment cancellation;
- clinic/practitioner block create/edit/remove;
- operational leave create/edit/remove; and
- working-schedule mutations.

The authorized operator set remains bounded to the governed production role shapes for Christel, Abigail, Marietjie and JP. Unrelated, inactive, unlinked or authority-drifted operators fail closed.

Existing `calendarCreateBooking`, `business_role`, `calendar_scope` and `service_scope` behavior is not broadened by this unit.

## Preserved safeguards

Every operational write remains server-authoritative and requires the authenticated staff session, same-origin JSON, CSRF, the exact operational capability, revision/idempotency checks, locking, final canonical scheduling validation and attributable audit evidence.

Payload-supplied actor identity is not authority. Successful mutations reload canonical Calendar state rather than treating optimistic browser state as scheduling truth.

Google Calendar is neither normal availability authority nor mutation authority for these operations.

Cancellation requires deliberate operator confirmation. Practitioner reassignment remains subject to destination service eligibility and availability. Blocks, leave and working-schedule changes fail closed when they would strand or conflict with existing appointments rather than silently moving or cancelling appointments.

## Exact-head executable proof

Final accepted head `0259721712d6b1bfc47a5c37ce801ed98f61a5d2`:

- GitHub CI #1545 / run `33114163521`: **SUCCESS**.
- Full CI regression: **1,224 / 1,224 PASS**.
- Authenticated non-production Chromium verification: **PASS**.
- Four intended operators verified.
- Ineligible operator fail-closed behavior verified.
- Manual and drag/drop reschedule parity verified.
- Reassignment, cancellation, block, operational leave and working-schedule paths verified.
- Cancellation decline produced zero submissions; acceptance required deliberate confirmation.
- Canonical Calendar reload after successful mutation verified.
- Google operational controls/requests: zero.
- Create Booking/service-scope regressions: unchanged and green.
- Mobile controls: 44px minimum targets and no horizontal overflow.
- Browser proof artifact #9663795180 contains the exact-head manifest and six hashed screenshots.

## Production release and health proof

00 released PR #516 under the ACTIVE bounded operational delegation after exact-head CI, authenticated non-production browser proof, scope verification, current-main compatibility reconciliation and mergeability checks.

Render automatic deployment `dep-da8a5gp5efls73dsig0g` deployed exact merge/main SHA `c68d29ddadca78db98bf544ba804963df8685f4c` and reached **live** on 2026-08-27.

Bounded post-deploy evidence confirmed:

- `Shiloh started`;
- HTTP server listening normally;
- normal schedulers/workers started; and
- Render `/health` returned HTTP 200.

No real appointment, booking, block, leave, working schedule, CRM record, Google event, provider configuration or client/provider message was mutated for release verification. Appointment #592 remained untouched.

## Completion / do not redo

00 — Control & Reconciliation accepts `SHILOH-CALENDAR-OPERATIONAL-MUTATIONS-P0` as **COMPLETE / FROZEN**.

Do not reopen, recreate, reimplement or rerun this engineering package absent new production defect evidence or a separately authorized controlled unit.

The first genuine operator use of these controls is normal operational observation, not an implementation completion gate. Do not manufacture a production appointment or mutation solely for proof.

## Next priority

The Calendar P0 operational layer is no longer the blocking implementation unit. Under the active stabilization spine, the next major internal priority returns to **20 — CRM & Identity** for Clean CRM V2 foundation/release and Calendar ↔ CRM V2 integration sequencing.
