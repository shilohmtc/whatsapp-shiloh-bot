# Shiloh OS — Master Status Addendum — Shiloh Calendar Control Ratification

Date: 2026-08-24
Owning workstream: **00 — Control & Reconciliation**
Implementation owner: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps** when required
Baseline: PR #451 / `a329b41a539a73b0fd768f0799eb3a09893ea593`
Durable state: **ARCHITECTURE RATIFIED WITH CALENDAR-FIRST BOOKING AMENDMENT**

## Durable architecture authority

PR #451's Shiloh Calendar foundation architecture is ratified.

Shiloh/Postgres remains canonical for appointments, practitioner allocation, schedules, blocks, leave/unavailability, history/audit and guarded booking/reschedule/cancellation state. `schedulingEngine` is the target single scheduling boundary and `SchedulingTimeline` is a derived read projection, not a second mutable scheduling source of truth.

Google Calendar remains during migration as the current external busy/conflict input where existing authority requires it and as the synchronized shared/practitioner mirror. PR #395 conflict classification and PR #380 multi-practitioner booking authority remain unchanged.

## Calendar-first booking product rule

When Shiloh Calendar reaches the Control-authorized operational mutation phase, **staff/Admin manual bookings must be initiated from Shiloh Calendar** rather than from a separate independent appointment-create workflow.

The Calendar remains an orchestration/interaction surface. Booking writes must delegate to the existing canonical guarded booking owner and re-run all permission, identity, practitioner eligibility/allocation, availability, conflict, approval and provider checks.

Client self-service, WhatsApp/AI and future booking channels may use channel-specific user experiences, but they must use the same `schedulingEngine` scheduling boundary and create the same canonical Shiloh appointment truth. No channel may maintain separate availability/conflict logic or bypass the canonical scheduling guards.

Every successful booking from every channel must project immediately into the same Shiloh Calendar timeline from canonical state.

After Calendar-first booking is production-authorized, legacy staff-facing booking entry points may only redirect/delegate during migration; they must not remain independent scheduling implementations.

## Product differentiation rule

Shiloh Calendar is **not** to be a clone of Goldie, Fresha, Google Calendar or another scheduling product.

Use familiar calendar conventions where they improve learnability and speed, but treat competitor behavior as a benchmark rather than the design specification. Shiloh-specific differentiation should be grounded in its own architecture and operational needs, especially explainable availability/conflicts, first-class multi-practitioner scheduling, provenance-aware timeline items, permission-aware actions, provider/mirror clarity and future intelligent scheduling assistance that never bypasses guards.

## Current implementation authority

`SHILOH-CALENDAR-READONLY-PROJECTION` is authorized now for **10 — Booking & Admin UX**.

The authorized slice remains read-only and must preserve all current production booking and Google Calendar behavior. It may introduce the `schedulingEngine` delegation facade, permission-filtered `listTimeline({from,to,viewer,staffIds})`, canonical/non-canonical provenance and deterministic parity/no-mutation tests.

## Still not authorized

No current authority exists for Calendar booking creation, reschedule/cancellation mutation, drag-and-drop mutation, schedule/block/leave writes, Google authority reduction, mirror removal, bidirectional Google appointment authority or Google optionality.

Those capabilities require later parity/reliability evidence and separate Control authorization.
