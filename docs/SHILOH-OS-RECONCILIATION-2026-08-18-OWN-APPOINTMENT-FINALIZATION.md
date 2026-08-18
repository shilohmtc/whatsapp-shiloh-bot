# Shiloh OS — Reconciliation — Own-Appointment Finalization

Date: 2026-08-18
Owning workstream: Booking & Admin UX
Observers: CRM & Identity for canonical Admin↔staff identity; Control & Reconciliation for shared continuity; WhatsApp / Meta Integration for template delivery; Production / DevOps for deployment evidence.

## Authority and business decision

The explicit accepted business rule is:

- Christel finalizes Christel appointments only;
- Abigail finalizes Abigail appointments only;
- Marietjie finalizes Marietjie appointments only;
- Jean-Pierre finalizes no appointments.

This replaces the former Christel→Christel+Abigail / Abigail→none rule. JP's separate #318 Christel+Abigail **booking** entitlement remains unchanged and does not confer attendance authority.

## Implementation

PR #324 centralizes own-practitioner finalization authority in `attendanceFinalizationAuthority` and uses it across:

- Appointments-menu and enriched Admin-menu visibility;
- certifiable pending queues and direct/crafted finalization actions;
- Completed, No-show, No charge, Cancelled, Reschedule, service-change and price-adjustment paths;
- end-of-day/next-morning finalization reminders;
- historical finalization action prompts.

Authority requires the Admin to be Christel, Abigail or Marietjie, to have a positive linked `staff_id`, and to match exactly one active canonical staff row with the same normalized practitioner name. Missing, unlinked, inactive, ambiguous or conflicting identity fails closed. A no-authority account receives no finalization rows. Mutation paths continue to revalidate assigned practitioner authority under the existing transaction and row lock before writing status, history, lifecycle and audit truth.

No attendance, appointment, CRM identity or Calendar record was changed by the implementation or verification. Appointment #558 remains unresolved with historical practitioner `SHILOH MTC`; no practitioner was inferred or assigned.

## Verification

- PR #324 merged as `ac461dd7b6b0774a89bd179f913f54dcfae2414d`.
- GitHub Actions CI run #1041 passed **662 / 0**.
- Regression covers all three own-authority identities, cross-practitioner denial, joint-assignment denial, missing/ambiguous identity fail-closed behavior, all four Admin menu outcomes, JP exclusion, reminder targeting and historical prompt targeting.
- Render deploy `dep-da2a3037uimc73a20leg` reached **LIVE**.
- Database-backed startup completed; the Google Calendar health check passed; repeated `/health` requests returned HTTP 200; no post-deployment error-level logs were present.
- `shiloh_staff_finalization_v1` and `shiloh_staff_finalization_actions_v1` remained **APPROVED / UTILITY**.
- Natural production scheduler evidence recorded successful own-authority reminder and action-template sends to the canonical Abigail recipient after she became eligible. This was operational use, not a manufactured appointment or attendance action.

The Render read-only Postgres connector still fails at its external connection boundary because it does not negotiate the database's required SSL/TLS mode. This connector limitation does not contradict the application's healthy database-backed startup and `/health` evidence. Checked-in canonical CRM migration lineage links Christel, Abigail and Marietjie Admin accounts to their staff rows and grants the permissions required by the finalization menu; JP remains intentionally unlinked.

## Completed — do not redo

Do not restore supervisor-style Christel→Abigail certification, add JP finalization, infer authority from booking scope/business role, or bypass the exact Admin↔staff identity check. Do not create an appointment or alter attendance for evidence.

## Remaining gates and ownership

- Historical attendance remains explicit human truth. Re-query current CRM state before quoting counts or routing any unresolved appointment.
- Present only safely routable unresolved appointments to the responsible practitioner Admin for explicit determination.
- Appointment #558 remains fail-closed with `SHILOH MTC`; CRM & Identity owns any practitioner reconciliation and Control & Reconciliation tracks that dependency.
- Any future canonical Admin/staff identity conflict must stop finalization work and route to CRM & Identity with Control tracking.
- `shiloh_booking_update_v1` remains **PENDING**; that provider gate is separate from attendance finalization.

Project Tracker and Master are reconciled because #324 changes the durable permission/finalization rule.
