# Shiloh OS — Master Status Addendum — Shiloh Calendar Foundation

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps**
Control authority: **00 — Control & Reconciliation**
Durable state: **DESIGN AUTHORITY COMPLETE / NO RUNTIME CHANGE**

## Current authority

The Shiloh-owned Calendar initiative has completed its first controlled unit: the current scheduling behavioural contract has been frozen and a target architecture has been proposed from GitHub `main` `4c58986700cf302aff7e2ca431f730c5a88840ed`.

Authoritative architecture:

`docs/SHILOH-OS-ARCHITECTURE-2026-08-24-SHILOH-CALENDAR-FOUNDATION.md`

This unit changes **no production scheduling behavior**.

## Canonical scheduling position

Shiloh/Postgres already owns the principal business truth required for a canonical scheduling product. Preserve existing canonical ownership for:

- appointments and lifecycle state;
- practitioner allocation through `appointment_staff`;
- service/practitioner eligibility;
- practitioner working hours and scheduling classification;
- clinic/location working hours and exceptions;
- `calendar_blocks`;
- leave workflow/unavailability state;
- appointment status/history and audit;
- guarded booking, reschedule and cancellation workflows.

Google Calendar remains during migration:

- an external busy/conflict input where current booking authority requires it; and
- a synchronized shared + practitioner mirror/output.

A Google event is not canonical appointment identity. Google event IDs/provider state are integration metadata around Shiloh canonical business truth.

## Durable behavioural authorities preserved

- PR #395 / `485ed97d8812fc291c71493dd1bb652b5da42f05` remains the practitioner Google Calendar conflict-classification authority: unrelated practitioner events do not by themselves block another assigned practitioner; shared/clinic-wide and relevant assigned-practitioner conflicts remain blocking, with provider fail-closed guards preserved.
- PR #380 remains multi-practitioner booking authority: one canonical appointment, multiple practitioner allocations, joint availability, stable locks/rechecks and all-practitioner mirror safety.
- Existing booking creation, approval, client identity, schedule, Block time, leave, reschedule, cancellation, attendance/finalization, history/audit and Google mirroring authorities remain unchanged.

## Architecture decision

**Recommended and adopted for Control review:** do not create a second mutable calendar/events scheduling store and do not build a Calendar UI over independent ad hoc conflict queries.

The target architecture is:

1. a single internal **`schedulingEngine`** boundary over existing authoritative scheduling and conflict owners; and
2. a rebuildable, derived **`SchedulingTimeline`** read projection for Calendar consumers.

The initial scheduling engine must delegate to existing behavior rather than rewrite it. The Calendar projection must preserve source provenance and distinguish canonical Shiloh objects from non-canonical external Google busy intervals.

## Calendar UX direction

Target operational views are Day, Week and Agenda with practitioner lanes and explicit presentation for appointments, blocks, approved leave, clinic closures, external Google-only busy intervals and mirror/provider degradation.

The first Calendar UX must be **read-only**. Existing guarded booking/manage/reschedule/cancel/block owners remain the only mutation paths until later controlled authority explicitly delegates actions into Calendar.

No drag-and-drop appointment mutation is authorized by this addendum.

## Permission model

Calendar visibility/action authority must derive from existing Shiloh identity and permissions. Practitioner scope, business-admin scope, booking entitlement, Block time authority, schedule-management authority, attendance/finalization authority and any controlled exceptions remain distinct capabilities. UI visibility must never substitute for server-side authorization.

## Migration and rollback position

Migration order is:

1. freeze behaviour — complete;
2. Control ratification;
3. read-only scheduling projection;
4. read-only internal Calendar UX;
5. parity/observability;
6. guarded delegated actions;
7. Shiloh-first operational scheduling after production proof;
8. only then reconsider Google optionality.

Early phases must be default-off/read-only and removable without business-data rollback. Projection failure must expose unavailable/degraded state rather than guessed scheduling truth. Existing booking and Google fail-closed behavior remains in force until deliberately superseded.

## Exact recommended first implementation slice

`SHILOH-CALENDAR-READONLY-PROJECTION`

It should add a `schedulingEngine` delegation facade, a permission-filtered `listTimeline({from,to,viewer,staffIds})` read contract and no-mutation/parity tests. It should **not** add new booking writes, new scheduling truth, a production Calendar mutation surface or changed Google semantics.

This slice is recommended **now**, but it is not authorized by this design unit. **00 — Control & Reconciliation** owns ratification and sequencing; once authorized, implementation returns to **10 — Booking & Admin UX**. **40 — Production & DevOps** supports database/performance/observability needs when required.

## Completed / do not redo

Goldie catalogue publication through Wave B remains VERIFIED LIVE / COMPLETE / DO NOT REDO under PR #445/#446 + migration 075, PR #447, PR #448 + migration 076, PR #449 + migration 077 and final reconciliation PR #450. Five Wave B HOLD rows and all Wave C gates remain fail closed under Control unless new authoritative evidence appears.

Do not repeat the Calendar behavioural discovery merely because implementation begins. Future work must start from this architecture, re-read then-current `main`, preserve newer authority, and address only actual deltas.

## Unresolved authority gate

The sole next gate for the Calendar initiative is **Control ratification/authorization of the first implementation slice**. No production scheduling or Google authority change is implied by completion of this design unit.