# Shiloh OS — Reconciliation — JP Booking Entitlement

Date: 2026-08-18
Owning workstream: Booking & Admin UX
Observers: Control & Reconciliation; CRM & Identity only if canonical identity evidence later conflicts.

## Authority reviewed

- GitHub `main` through merged PR #318 / `aafd7acb278be97ddc1c0dc4b1fca25b16e83d5a`.
- `docs/SHILOH-OS-MASTER-STATUS.md`.
- `docs/SHILOH-OS-PROJECT-TRACKER.md`.
- Previous latest reconciliation: `docs/SHILOH-OS-RECONCILIATION-2026-08-18-SPECIALIST-WORKSTREAM-RECONCILIATION.md`.
- `docs/SHILOH-OS-ENGINEERING-GOVERNANCE.md`.
- PR #313 menu and booking-scope implementation, PR #318 implementation and regression coverage, GitHub Actions CI, and verified Render production state.
- Explicit business rule from Christel: JP must have the same Admin access as Christel, except attendance finalization.

No attendance, booking, CRM link, practitioner identity, or provider-delivery state was inferred or mutated during this reconciliation.

## Conflict and controlled decision

Production previously presented **Make a booking** to JP while the booking-scope guard rejected the journey because JP was an unlinked Admin. The interactive messages were processed successfully and there were no error-level logs, so this was a menu/entitlement contract conflict rather than provider failure.

The accepted business rule resolves the conflict narrowly:

- JP has Christel-equivalent authorized Admin operational actions.
- JP may book **Christel or Abigail only**.
- JP has no clinic-wide practitioner scope.
- JP cannot finalize past visits or otherwise certify attendance.
- JP remains unlinked; no practitioner/CRM link is manufactured.
- Every other unlinked Admin remains fail-closed with no booking catalogue.

If JP's canonical identity or role/scope fields cease to match the guarded contract, booking access fails closed. Any future identity conflict stops in CRM & Identity, with Control & Reconciliation tracking the dependency.

## Implementation and safeguards

PR #318 added a single canonical application entitlement used by both the Appointments menu and the Admin mobile booking flow. **Make a booking** is presented only when the same entitlement yields a usable practitioner scope.

The database enforcement function for `admin_booking_sessions` mirrors the narrow JP exception and preserves the existing fail-closed rules for linked practitioners, normal prepares, crafted writes and historical prepare paths. The change does not weaken availability, clinic-hours, staff-schedule, CRM-conflict, Google Calendar-conflict, client-selection, review or explicit-confirmation guards.

## Verification

- PR #318 merged as `aafd7acb278be97ddc1c0dc4b1fca25b16e83d5a`.
- GitHub Actions CI run #1026 completed successfully.
- Full regression: **642 passed / 0 failed**.
- Render deploy `dep-da2909ou01pc73bite9g` reached **LIVE**.
- No post-deployment error-level logs were present.
- Google Calendar provider health check passed.
- Production `/health` reported application and database status `ok`.

This verifies the merged code and production service health. It does not manufacture or claim a post-fix handset booking. A natural JP WhatsApp retry may provide additional presentation evidence; do not create or change an appointment merely for proof.

## Completed — do not redo

The JP menu/entitlement contradiction is resolved in the accepted production contract. Do not remove JP's booking action under the superseded no-scope rule, grant clinic-wide access, weaken the fail-closed guard, create a practitioner link by inference, or reopen PR #313/#318 implementation without newer contradictory authority.

Attendance authority is unchanged. Historical attendance remains a separate human-truth review. Appointment #558 remains fail-closed with historical practitioner `SHILOH MTC`; never infer or silently assign its practitioner.

## Reconciliation and remaining gates

The Project Tracker and Master are reconciled to PR #318, CI #1026 and the verified production deployment because this change alters a durable permission/menu rule.

Remaining external or human gates are unchanged:

- `shiloh_booking_update_v1` provider approval.
- Google Business Profile positive access or usable general request quota.
- Current historical attendance review and explicit human truth for #558.
- Genuine handset/lifecycle evidence only when it occurs naturally.

Control & Reconciliation owns cross-workstream continuity. CRM & Identity becomes the blocking owner only if canonical JP identity or practitioner evidence conflicts with this guarded entitlement.
