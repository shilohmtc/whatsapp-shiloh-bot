# Shiloh OS — Control & Reconciliation — Shiloh Calendar Ratification

Date: 2026-08-24
Owning workstream: **00 — Control & Reconciliation**
Implementation owner after this decision: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps** when required
Baseline authority: PR #451 / `a329b41a539a73b0fd768f0799eb3a09893ea593`
Status: **RATIFIED WITH AMENDMENT / FIRST IMPLEMENTATION SLICE AUTHORIZED**

## Control decision

00 — Control & Reconciliation independently reviewed the Shiloh Calendar foundation architecture frozen by PR #451.

Decision: **RATIFY WITH ONE PRODUCT AMENDMENT and AUTHORIZE `SHILOH-CALENDAR-READONLY-PROJECTION` for implementation now.**

The core PR #451 architecture remains correct:

- Shiloh/Postgres remains canonical scheduling business truth.
- There must be no second mutable `calendar_events` scheduling source of truth.
- `schedulingEngine` becomes the single internal scheduling boundary by delegating to existing authoritative owners before any algorithm rewrite.
- `SchedulingTimeline` is a rebuildable read projection, never canonical business truth.
- Google Calendar remains the current external busy/conflict input where existing authority requires it and the synchronized shared/practitioner mirror during migration.
- PR #395 conflict classification and PR #380 multi-practitioner booking authority remain durable and unchanged.
- Existing booking, reschedule, cancellation, block, leave, schedule, permission, audit/history and Google fail-closed behavior remains unchanged until separately superseded.

## Durable product amendment — Calendar-first booking

When Shiloh Calendar reaches the later **guarded mutation / operational booking phase**, the product must become **Calendar-first for booking**.

This means:

1. **Staff/Admin manual bookings must originate from Shiloh Calendar**, for example by selecting an available time/slot or invoking Create booking from the Calendar context.
2. The Calendar is an interaction/orchestration surface, **not a new source of truth**. Every booking mutation must still delegate to the canonical guarded booking owner and re-run permission, identity, eligibility, practitioner allocation, schedule, conflict, approval and provider guards.
3. **Client self-service, WhatsApp/AI and future booking channels may keep channel-appropriate UX**, but they must consume the same `schedulingEngine` availability/conflict boundary and create the same canonical appointment truth. They may not introduce independent slot logic or a bypass path around Shiloh scheduling authority.
4. Every successful booking, regardless of channel, must immediately resolve into the same canonical Shiloh appointment/timeline state and therefore appear in Shiloh Calendar from canonical truth.
5. After Calendar-first booking is production-authorized, no separate staff-facing direct appointment-create workflow may remain as an independent scheduling path. Legacy entry points may temporarily redirect/delegate during migration, but may not retain separate scheduling logic.

This amendment does **not** authorize booking mutations in the current read-only projection slice. It establishes the target operating rule that becomes binding when Control later authorizes Calendar-native booking actions.

## Product direction — benchmark, do not clone

Shiloh Calendar must not be implemented as a visual or workflow clone of Goldie, Fresha, Google Calendar or another scheduling product.

Industry-standard interaction patterns may be reused where they reduce training cost or are already expected by users, but competitive products are a **benchmark/floor, not the product specification**.

Shiloh-specific differentiation should come from the architecture already chosen and from capabilities that are materially useful to Shiloh operations, including:

- one explainable scheduling engine across staff, Admin, client and conversational channels;
- first-class multi-practitioner booking rather than duplicated pseudo-events;
- visible provenance between canonical appointments, blocks, leave/closures and external Google-only busy state;
- permission-aware actions and conflict explanations at the point of scheduling;
- clear provider/mirror health without confusing integration state with appointment truth;
- future intelligent assistance that proposes useful scheduling choices without bypassing authorization or conflict guards.

Distinctiveness must not come at the cost of recognizability, accessibility or operational speed. Use familiar calendar mechanics when they are already optimal; improve the parts that create friction, ambiguity or duplicated work.

## Authorized implementation slice

`SHILOH-CALENDAR-READONLY-PROJECTION` is **AUTHORIZED NOW** for **10 — Booking & Admin UX**.

Authorized bounded scope:

- add `src/services/schedulingEngine.js` as a delegation facade, not an availability rewrite;
- add permission-filtered `listTimeline({from,to,viewer,staffIds})`;
- project appointments + `appointment_staff`, `calendar_blocks`, effective working windows/exceptions, approved leave/unavailability and distinct Google external-busy intervals from existing authority;
- preserve source provenance and canonical/non-canonical distinction;
- add deterministic no-mutation tests;
- add parity tests for single-practitioner, multi-practitioner and PR #395 conflict classification;
- keep the slice read-only and feature-gated/default-off where applicable;
- preserve all production booking/Google behavior.

## Explicitly still not authorized

This Control decision does **not** authorize:

- production Calendar booking creation UI;
- booking, rescheduling or cancellation mutations through Calendar;
- drag-and-drop appointment mutation;
- changing practitioner/clinic working hours;
- creating/removing blocks or leave;
- bulk migration of appointment/schedule/block/leave truth;
- weakening provider/conflict guards;
- removing shared/practitioner Google mirrors;
- bidirectional Google-to-Shiloh appointment authority;
- making Google Calendar optional;
- replacing current production booking behavior before parity/reliability proof and a later Control decision.

## Sequence after this decision

1. **Read-only scheduling projection** — authorized now; owner 10 — Booking & Admin UX.
2. Read-only Day/Week/Agenda Calendar UX — later bounded implementation after projection acceptance.
3. Parity/observability proof across current booking availability, projection and Google conflict outcomes.
4. Guarded Calendar actions by delegation.
5. **Calendar-first staff/Admin booking activation**, with all channels using the same scheduling boundary.
6. Production reliability/operational acceptance.
7. Only then reconsider Google optionality under separate Control authority.

## Control recommendation

Do this **now**. If Shiloh OS were my own project, I would preserve PR #451's single-truth architecture, implement the read-only scheduling boundary first, and make Calendar-first booking a later mandatory operating invariant rather than rushing mutation into the first slice.

That sequence gives Shiloh a distinctive product without sacrificing correctness: Shiloh owns the scheduling experience, while canonical business rules remain centralized and testable.
