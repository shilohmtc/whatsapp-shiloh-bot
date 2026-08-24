# Shiloh OS — Project Tracker Addendum — Shiloh Calendar Control Ratification

Date: 2026-08-24
Control owner: **00 — Control & Reconciliation**
Implementation owner: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps** when required
State: **🟢 CONTROL RATIFICATION COMPLETE / READ-ONLY PROJECTION AUTHORIZED**

## Reconciliation

`SHILOH-CALENDAR-FOUNDATION-ARCHITECTURE` remains **🟢 COMPLETE** under PR #451.

Control has ratified the architecture with one durable product amendment: when Shiloh Calendar later reaches the guarded operational mutation phase, staff/Admin manual booking must become **Calendar-first** while all booking writes continue through the canonical guarded booking owner.

Client self-service, WhatsApp/AI and future booking channels may keep channel-specific UX but must share the same `schedulingEngine` scheduling/availability/conflict boundary and create the same canonical appointment truth. No independent scheduling logic or bypass path is permitted.

Shiloh Calendar must benchmark competitor products without cloning them. Familiar interaction patterns may be retained where useful; differentiation should come from Shiloh-native scheduling behavior and operational intelligence.

## Next implementation unit

`SHILOH-CALENDAR-READONLY-PROJECTION`

State: **🟢 AUTHORIZED FOR IMPLEMENTATION**

Owner: **10 — Booking & Admin UX**

Authorized scope:

- `src/services/schedulingEngine.js` as a delegation facade, not an availability rewrite;
- permission-filtered `listTimeline({from,to,viewer,staffIds})`;
- projection of canonical appointments/staff allocations, blocks, effective scheduling windows/exceptions, approved leave/unavailability and distinct external Google busy intervals;
- canonical/non-canonical provenance;
- deterministic no-mutation tests;
- parity tests for single-practitioner, multi-practitioner and PR #395 conflict classification;
- read-only / feature-gated behavior only;
- no change to production booking or Google Calendar authority.

## Holds preserved

Still not authorized:

- Calendar-native booking creation UI;
- booking/reschedule/cancellation mutation through Calendar;
- drag/drop appointment mutation;
- schedule/block/leave writes;
- bulk scheduling-data migration;
- weakening provider/conflict guards;
- removing shared/practitioner Google mirrors;
- bidirectional Google appointment authority;
- making Google Calendar optional.

## Priority sequence

1. **Now:** 10 builds `SHILOH-CALENDAR-READONLY-PROJECTION`.
2. Then Control accepts/rejects parity evidence.
3. Then read-only Day/Week/Agenda Calendar UX.
4. Then parity/observability hardening.
5. Then guarded delegated Calendar actions.
6. Then Calendar-first staff/Admin booking activation under separate Control authority.
7. Only after production proof may Google optionality be reconsidered.
