# Shiloh OS — Reconciliation — Booking/Admin Juvan Primary/Backup + Manage Booking Cancellation

Date: 2026-08-20
Owning workstream: Booking & Admin UX
Status: VERIFIED LIVE

## Purpose

This reconciliation advances Booking & Admin UX authority from the CRM-controlled Juvan identity foundation (#364) through the two subsequent production-verified application units that were live before Master/Tracker had been reconciled:

1. PR #366 — Juvan assigned-practitioner Primary approver + Jean-Pierre Backup approver, atomic first-decision-wins, and JP-only Reset Juvan Admin presentation.
2. PR #367 — first-class guarded Cancel booking action inside Manage booking, delegated to the canonical Admin appointment-cancellation state machine.

No handset, booking, cancellation, approval decision, Juvan reset/re-registration, CRM mutation or Calendar mutation was manufactured merely to produce evidence.

## Current application authority

Current GitHub `main` application commit after #367:

`9219bdef30e5452bc225a86d4f644d76149b528d`

PR #367 was tested by GitHub Actions CI #1166. The complete non-mutating suite passed **800 / 800**, with zero failures and zero skipped tests.

Render workspace **My Workspace** auto-deployed exact commit `9219bdef30e5452bc225a86d4f644d76149b528d` as deploy `dep-da3fnb49v7es73fp3360`, which reached **LIVE**. Startup and repeated `/health` probes returned HTTP 200. Google Calendar provider health passed.

Production startup also reverified the Juvan controlled-identity chain through migrations 065/066/067/068 with checksum-valid state, current binding state BOUND, current canonical client pointer presently 845, display `Juvan Botha`, controlled phone suffix 1564, Jean-Pierre admin 4, and approval contract `assigned_practitioner_primary_jean_pierre_backup_first_decision_wins`.

Client practitioner-approved rescheduling remained explicitly dark with `featureEnabled=false`; this reconciliation does not authorize `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED`.

## PR #366 — Juvan Primary / Backup approval

PR #366 merged as:

`53b5e0c4027f9910291f75c05ec13d9c55528118`

CI #1164 passed the full non-mutating suite **796 / 796**.

Render deploy `dep-da3eiegae00c7380pa8g` reached LIVE on exact #366 merge SHA before being normally superseded by #367.

The production startup applied/checksum-verified migration `068_juvan_primary_backup_booking_approval.sql`.

Current Juvan booking-approval semantics are:

- the appointment's assigned position-1 practitioner is **Primary approver**;
- exact Jean-Pierre business Admin is **Backup approver**;
- the current controlled Juvan client is resolved through the #364 phone-anchored controlled identity/current-client pointer, not by display-name matching and not by permanently hard-coding historical client 845;
- Primary and Backup are re-authorized against current canonical identity and appointment truth at decision time;
- the decision transaction locks/revalidates the relevant controlled identity, approval and appointment state;
- exactly one terminal decision may win; a later authorized attempt cannot commit a second authoritative decision and receives already-decided state;
- staff-facing approval presentation identifies Primary, Backup, client, appointment/service/time context and recipient role;
- approval preserves the existing idempotent client confirmation path;
- decline preserves canonical cancellation, history/audit, Calendar release and client-notification safeguards.

The Admin menu exposes **Reset Juvan** only to exact authorized Jean-Pierre and delegates to the existing #364 CRM reset contract. Booking/Admin does not duplicate CRM reset, contact release, archive/unbind or onboarding/rebind logic.

Genuine booking #585 remains accepted historical evidence of the superseded JP-sole-approver behavior. It was not recreated or altered for #366 proof.

No genuine Juvan reset, re-registration, new booking, approval or decline was manufactured.

## PR #367 — Manage booking guarded cancellation

PR #367 merged as current application commit:

`9219bdef30e5452bc225a86d4f644d76149b528d`

The Manage booking interaction now exposes, immediately before Back:

- **Cancel booking**
- description: **Cancel this appointment safely**

The action is appointment-scoped and restart-safe (`manage_cancel_booking_<appointmentId>`). It delegates into the existing `adminAppointmentCancellation` owner rather than adding cancellation SQL or a second cancellation implementation to the booking-update bridge.

Selecting Cancel booking is non-destructive. The canonical flow still requires:

1. a cancellation reason;
2. explicit `Confirm cancellation` before mutation;
3. fresh canonical appointment state at the cancellation transaction;
4. existing status-history and CRM-audit writes;
5. existing shared/practitioner Google Calendar cancellation synchronization.

While a canonical cancellation intent is pending, reason/Confirm/Back responses take precedence over the still-open Manage booking session. This prevents the volatile booking-update session from stealing cancellation continuation.

The unrelated plain-text Admin command `cancel booking`, which discards a pending **new-booking draft**, remains unchanged and is not reused as the selected existing-appointment action.

CI #1166 includes explicit regression coverage for:

- Cancel booking row presence/order;
- appointment scoping;
- delegation to canonical cancellation;
- absence of duplicated appointment-cancellation SQL in the bridge;
- pending cancellation intent precedence;
- reason + confirmation gating;
- preservation of the unrelated pending-new-booking cancel command.

No real appointment was cancelled merely to prove #367.

## Preserved authority and gates

#366/#367 do not weaken or replace:

- #318 Booking/Admin entitlement boundaries;
- #360 Block time authority and `calendar_blocks` semantics;
- own-practitioner attendance/finalization authority through #324;
- appointment #558 HOLD;
- Google Calendar fail-closed booking safeguards;
- controlled Juvan identity lifecycle from #364;
- historical #585 evidence;
- completed Dummy Test reset and booking-cleanup evidence;
- client-welcome repair;
- booking-update activation and stale suppression;
- CRM ambiguity/shared-contact fail-closed rules;
- booking confirmation v1 provider/live behavior;
- practitioner-approved reschedule provider gate.

Google Calendar remains a synchronized provider/mirror and canonical Shiloh CRM/appointment state remains authoritative.

## Separate UX follow-up not implemented here

A later proposed improvement is context-aware navigation after a successful cancellation: when cancellation was entered from a selected client's Manage Client journey, return to that same client's management screen; standalone Manage booking may instead offer bounded next actions. This behavior is **not part of #367**, is not claimed as live by this reconciliation, and requires its own explicit implementation authorization.

## Exact continuation

Authoritative application state: **PR #367 / `9219bdef30e5452bc225a86d4f644d76149b528d`**, CI #1166 **800/800**, Render deploy `dep-da3fnb49v7es73fp3360` **LIVE**.

Current Juvan approval behavior is practitioner **Primary** + Jean-Pierre **Backup** + atomic first decision wins, using the current controlled Juvan identity resolver/pointer. JP-only Reset Juvan presentation is live and delegates to CRM's existing controlled reset contract.

Manage booking cancellation is live and confirm-gated through the canonical cancellation service. No genuine cancellation was manufactured for proof.

The highest-priority remaining external gate is practitioner-approved client rescheduling. WhatsApp / Meta Integration remains the monitoring owner for genuinely read-only provider status of `shiloh_reschedule_approval_request_v1` and `shiloh_reschedule_declined_v1`. Do not enable rescheduling until both independently satisfy `APPROVED / UTILITY / en / exact=true / duplicateCount=0 / configured=true` and the provider state is reconciled.

A genuine Juvan reset → new registration → canonical rebind remains a real-device evidence boundary and must not be executed merely for proof.
