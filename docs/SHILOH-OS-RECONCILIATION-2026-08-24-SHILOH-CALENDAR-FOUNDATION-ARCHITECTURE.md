# Shiloh OS — Reconciliation — Shiloh Calendar Foundation Architecture

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Previous owner: **00 — Control & Reconciliation**
Supporting dependency: **40 — Production & DevOps**
Inspected baseline: `4c58986700cf302aff7e2ca431f730c5a88840ed`
Controlled-unit state: **ARCHITECTURE + BEHAVIOURAL CONTRACT COMPLETE / NO RUNTIME CHANGE**

## Purpose

Freeze the current scheduling contract before any Shiloh-owned Calendar implementation and propose a safe target architecture that can eventually make Shiloh the canonical scheduling product without prematurely removing Google Calendar conflict or mirror behavior.

## Inspection completed

The current scheduling contract was traced across current `main`, including appointment truth, practitioner allocation, staff/clinic working hours, scheduling classification, schedule/location exceptions, public holidays, `calendar_blocks`, leave workflow state, client/Admin availability, Google conflict semantics, booking creation, rescheduling, cancellation, multi-practitioner behavior, historical/finalized state, audit/history, Admin permission boundaries and shared/practitioner Google mirroring.

Key inspected owners include current scheduling/availability services and migrations that establish appointment, schedule, permission, Calendar bridge, customer lifecycle, change/recovery, leave and reschedule state.

## Authoritative outcome

The architecture does **not** introduce a second mutable Calendar source of truth.

Shiloh/Postgres remains canonical for scheduling business state. The proposed Shiloh Calendar is built from:

- a single `schedulingEngine` boundary which initially delegates to current authoritative behavior; and
- a rebuildable `SchedulingTimeline` read projection for Calendar consumers.

Google Calendar remains during migration as both current external busy/conflict input where required and shared/practitioner mirror output. Existing Google provider-health and fail-closed behavior remains unchanged.

The full behavioural freeze and target model are authoritative in:

`docs/SHILOH-OS-ARCHITECTURE-2026-08-24-SHILOH-CALENDAR-FOUNDATION.md`

## Current durable rules preserved

- Canonical appointment truth remains Shiloh/Postgres, not Google event identity.
- `appointment_staff` remains practitioner assignment authority.
- Staff/clinic schedules and exceptions remain Shiloh-owned.
- `calendar_blocks` remains canonical blocked-time authority.
- Approved leave/closures are Shiloh scheduling state, not inferred from Google-only events.
- Existing availability/conflict ordering remains authoritative.
- PR #395 remains Google practitioner-event classification authority.
- Existing booking creation/final rechecks and approval rules remain unchanged.
- Existing reschedule rules/approvals and multi-staff fail-closed boundaries remain unchanged.
- Existing cancellation reason/confirmation and multi-staff safety remain unchanged.
- PR #380 remains multi-practitioner booking authority.
- Historical/finalized appointments and audit/history remain preserved.
- Existing Admin booking, schedule, block, attendance and identity permissions remain distinct.
- Existing client booking interactions remain current mutation owners.
- Shared/practitioner Google mirroring, recovery and compensation remain in production.

## Recommendation

**Recommended option:** build a scheduling facade + derived read-only timeline projection over existing canonical sources.

Reject:

1. a new mutable Calendar/events database as parallel truth; and
2. a visual Calendar implemented directly over separate ad hoc conflict queries.

If Shiloh OS were my own project, I would choose the facade/projection architecture and implement it **now** as the next major priority, but I would delay any scheduling mutation surface and any Google authority reduction until parity and reliability are proven.

Material trade-off: this produces less immediately visible UI than starting with a rich Calendar front end, but it materially reduces dual-truth, conflict-divergence and rollback risk.

## Exact first implementation slice

Recommended slice: **`SHILOH-CALENDAR-READONLY-PROJECTION`**.

It should:

- introduce `src/services/schedulingEngine.js` as a delegation facade;
- expose a permission-filtered `listTimeline({from,to,viewer,staffIds})` read contract;
- project canonical appointments/assignments, blocks, effective working windows/exceptions, approved leave/unavailability and external Google busy as distinct source-aware item types;
- add no-mutation tests and parity coverage for current single/multi-staff availability and PR #395 conflict semantics;
- remain feature-gated/read-only;
- add no direct booking, reschedule, cancellation, block, leave or Google write path.

A production Calendar UI is not part of this first slice unless Control separately authorizes it.

## Migration sequence

1. Behavioural freeze + architecture — **COMPLETE**.
2. Control ratification and first-slice authorization.
3. Read-only scheduling projection.
4. Read-only internal Calendar Day/Week/Agenda UX.
5. Parity/reliability instrumentation alongside current Google integration.
6. Guarded actions only by delegation to existing canonical owners.
7. Shiloh-first operational scheduling after production proof.
8. Separate Control decision before Google becomes optional.

## Explicit non-authorizations

No appointment, schedule, block, leave, clinic closure, booking, reschedule, cancellation, practitioner assignment, Google event, mirror, provider setting or production business data was changed by this unit.

This unit does not authorize replacement of Google production behavior, bulk data migration, weakened conflict guards, drag/drop mutations or bidirectional Google appointment authority.

## Project Tracker reconciliation

A dated Project Tracker addendum records `SHILOH-CALENDAR-FOUNDATION-ARCHITECTURE` as **🟢 DESIGN AUTHORITY COMPLETE / IMPLEMENTATION NOT STARTED**, and the recommended first slice as ready for Control ratification but not yet implementation-authorized.

## Master Status reconciliation

A dated Master Status addendum records the architecture, preserved behavioral authorities, migration sequence, fail-closed position and Control gate without changing current runtime authority.

## Preserved prior priority

Goldie catalogue publication through Wave B is complete/verified live/do-not-redo. PR #445/#446 + migration 075, PR #447, PR #448 + migration 076, PR #449 + migration 077 and PR #450 remain authoritative. Five Wave B HOLD rows and all Wave C gates remain under Control only if new evidence appears.

## Unresolved gate / next owner

**00 — Control & Reconciliation** owns the next decision: ratify this architecture/migration sequence and authorize, amend or reject `SHILOH-CALENDAR-READONLY-PROJECTION`.

If authorized, implementation returns to **10 — Booking & Admin UX**, with **40 — Production & DevOps** supporting infrastructure/performance/observability where required.

Do not begin Calendar runtime implementation from this reconciliation alone.