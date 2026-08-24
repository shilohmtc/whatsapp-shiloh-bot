# Shiloh OS — Project Tracker Addendum — Shiloh Calendar Foundation

Date: 2026-08-24
Owner: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps**
Control authority: **00 — Control & Reconciliation**
State: **🟢 DESIGN AUTHORITY COMPLETE / IMPLEMENTATION NOT STARTED**

## Tracker reconciliation

`SHILOH-CALENDAR-FOUNDATION-ARCHITECTURE` is **🟢 COMPLETE** as a bounded design/authority unit.

Authoritative artifact:

- `docs/SHILOH-OS-ARCHITECTURE-2026-08-24-SHILOH-CALENDAR-FOUNDATION.md`
- Inspected baseline: GitHub `main` `4c58986700cf302aff7e2ca431f730c5a88840ed`

The frozen contract establishes that Shiloh/Postgres remains canonical for appointment and scheduling business truth. Google Calendar remains, during migration, the current external busy/conflict input where existing rules require it and the synchronized shared/practitioner mirror output.

PR #395 remains durable practitioner Google Calendar conflict-classification authority. PR #380 remains durable multi-practitioner booking authority. Existing booking, reschedule, cancellation, block, leave, schedule, permission, audit/history and Google mirror behavior remain unchanged.

## Recommended architecture

Do not create a second mutable calendar/events source of truth.

Introduce:

1. one internal `schedulingEngine` facade over existing authoritative scheduling/conflict owners; and
2. a rebuildable read-only `SchedulingTimeline` projection for Calendar consumers.

The Calendar projection must derive appointments, staff assignment, blocks, effective working windows/exceptions, approved leave/closures and external Google busy state from existing authoritative sources. Projection loss/rebuild must never delete or mutate business truth.

## Exact next implementation slice

`SHILOH-CALENDAR-READONLY-PROJECTION`

State: **⚪ READY FOR CONTROL RATIFICATION / NOT YET AUTHORIZED FOR IMPLEMENTATION**.

Recommended bounded scope:

- add `src/services/schedulingEngine.js` as a delegation facade, not an algorithm rewrite;
- add a read-only `listTimeline({from,to,viewer,staffIds})` contract;
- project canonical appointments + `appointment_staff`, `calendar_blocks`, effective hours/exceptions, approved leave/unavailability through existing authority, and Google external busy as a distinct non-canonical item;
- apply existing server-side permission/scope rules;
- add deterministic no-mutation and parity tests, including single-staff, multi-staff and PR #395 conflict classification;
- no production Calendar UI or mutation path unless separately authorized.

## Migration sequence

1. Behavioural contract — **complete**.
2. Control ratifies architecture and sequence.
3. Booking & Admin UX builds read-only projection.
4. Production & DevOps supports performance/observability/infrastructure where required.
5. Add read-only Day/Week/Agenda UX and parity instrumentation.
6. Add only guarded delegated actions through existing canonical owners.
7. Prove production parity/reliability.
8. Only then may Control consider reducing Google Calendar authority/optionality.

## Explicit holds

This unit does **not** authorize:

- replacing Google Calendar production behavior;
- weakening current Google/provider conflict guards;
- bulk migration of appointment/schedule/block/leave truth;
- changing practitioner or clinic working hours;
- creating/editing/cancelling/rescheduling appointments;
- creating/removing blocks or leave;
- removing shared/practitioner Google mirrors;
- drag-and-drop direct appointment mutation;
- bidirectional Google-to-Shiloh appointment authority.

## Preserved completed priority

Goldie catalogue publication through Wave B remains **VERIFIED LIVE / COMPLETE / DO NOT REDO** under PR #445/#446 + migration 075, PR #447, PR #448 + migration 076, PR #449 + migration 077 and PR #450. Five Wave B HOLD rows and all Wave C fail-closed gates remain with Control only if new authoritative evidence appears.

## Next action

**00 — Control & Reconciliation** should ratify the architecture/migration sequence and decide whether to authorize `SHILOH-CALENDAR-READONLY-PROJECTION`. After authorization, route implementation back to **10 — Booking & Admin UX**.