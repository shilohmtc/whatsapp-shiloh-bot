# Shiloh OS — Shiloh Calendar Foundation Architecture

Date: 2026-08-24
Owning workstream: **10 — Booking & Admin UX**
Supporting dependency: **40 — Production & DevOps**
Control authority for migration sequencing and any source-of-truth change: **00 — Control & Reconciliation**
Baseline inspected: GitHub `main` **`4c58986700cf302aff7e2ca431f730c5a88840ed`**
Status: **DESIGN AUTHORITY / NO RUNTIME CHANGE**

## Executive decision

Shiloh Calendar should become the canonical **scheduling product**, but it should not begin as a second scheduling database or as a visual clone of Google Calendar.

The existing Shiloh/Postgres scheduling domain already owns most canonical business truth: appointments, practitioner assignment, working hours, schedule exceptions, blocks, leave workflow state, appointment history/audit, and booking/cancellation/reschedule state. The correct architecture is therefore to make this domain explicit behind a single scheduling boundary and expose a first-class Calendar UX over it.

Google Calendar remains, during migration, both:

1. an external conflict input where current authority requires it; and
2. a synchronized mirror/output for shared and practitioner calendars.

Google Calendar must not be removed from production conflict or mirroring behavior until Shiloh Calendar has separately proven parity, reliability and operational observability under Control-approved migration authority.

## Current behavioural contract — freeze before replacement

The following contract is authoritative until deliberately superseded by later controlled authority.

### 1. Canonical appointment truth

The canonical appointment record is Shiloh/Postgres `appointments`, not a Google Calendar event. Appointment lifecycle/status/history is preserved in Shiloh. Google event identifiers are synchronization metadata, not the business appointment identity.

### 2. Practitioner schedules / working hours

Practitioner availability derives from Shiloh scheduling tables and rules, including staff working hours, staff scheduling classification, clinic/location working hours and clinic-hours inheritance where configured. Scheduling truth must not be reconstructed from Google Calendar working hours.

### 3. Blocked time

`calendar_blocks` is canonical Shiloh blocked-time authority. Existing Admin Block time behavior uses this primitive rather than manufacturing appointments. Availability excludes overlapping blocks before Google Calendar conflict evaluation.

### 4. Practitioner leave

Leave is a Shiloh workflow/state concern, not a Google-event-only concern. Approved leave/unavailability must ultimately project into scheduling availability and Calendar presentation through Shiloh-owned state. Any existing approved leave semantics remain unchanged until a separately authorized implementation unit unifies their projection.

### 5. Clinic-wide closures

Clinic/location exceptions, public holidays and location working-hour exceptions are Shiloh scheduling inputs and remain authoritative for bookability. They are not inferred from an arbitrary shared Google Calendar event.

### 6. Client and Admin availability

Client and Admin booking flows must continue to consume the canonical Shiloh availability engine and its current guards. Calendar UX must be a consumer of the same scheduling boundary, not a separate availability calculator.

### 7. Appointment conflicts

Canonical Shiloh appointment overlaps are blocking. Conflict checks must include the current appointment/staff allocation model, existing holds/state where applicable, `calendar_blocks`, schedules/exceptions and current provider conflict semantics. Calendar presentation may explain conflicts, but may not redefine them.

### 8. Google Calendar conflict semantics

PR #395 / `485ed97d8812fc291c71493dd1bb652b5da42f05` remains durable authority:

- an unrelated practitioner's practitioner-Calendar event does not, by itself, block the assigned practitioner;
- shared/clinic-wide blocking events remain blocking under current rules;
- events on the relevant assigned practitioner's Calendar remain blocking;
- provider-health failure and unresolved relevant Calendar evidence remain fail closed where existing booking flows require them.

Shiloh Calendar must preserve this classification exactly until Control approves a later authority change.

### 9. Booking creation

Booking creation remains owned by existing guarded booking flows. Final conflict rechecks, identity/permission rules, practitioner locks/allocation rules, booking approval rules, client-policy requirements and Calendar side-effect compensation remain authoritative. Calendar UX does not receive a new direct-write path in the foundation phase.

### 10. Rescheduling

Existing client/Admin reschedule rules remain authoritative, including start-boundary guards, practitioner approval where configured, single-staff limitations and current fail-closed behavior. Calendar drag-and-drop is explicitly **not** authorized in the first phase because it would bypass these contracts.

### 11. Cancellation

Existing canonical cancellation state machines remain authoritative. Reason/confirmation gating and multi-staff cancellation safety remain unchanged. Calendar event deletion is a synchronized side effect after canonical cancellation truth, not the canonical cancellation itself.

### 12. Practitioner assignment

`appointment_staff` and the existing service/practitioner eligibility model remain canonical. Calendar lanes/views must derive assigned practitioners from Shiloh, never infer assignment from event titles, organizer identity or Google calendar location.

### 13. Multi-practitioner bookings

PR #380 remains durable multi-staff authority. Multi-practitioner appointments must remain one canonical appointment with multiple staff allocations, shared availability intersection, stable locking/recheck semantics and all-practitioner Calendar mirroring/cleanup. Calendar UX must render one appointment across all assigned practitioner lanes without duplicating appointment truth.

### 14. Historical/finalized appointments

Completed, no-show, cancelled and other finalized historical appointments remain preserved in Shiloh. Calendar views may filter them, but must not delete, collapse or rewrite historical truth merely because a Google mirror is absent or changed.

### 15. Audit/history

Existing appointment status history, CRM audit, scheduling audit and dedicated workflow history remain authoritative. Shiloh Calendar must add auditability around any future Calendar-native mutation rather than replacing existing history. Read/view operations do not create business-history truth.

### 16. Admin controls

Current Booking/Admin permission boundaries remain authoritative, including booking entitlement, attendance/finalization authority, Block time authority, schedule-management permission, practitioner scope and Jean-Pierre-specific controlled exceptions. Calendar must enforce permissions server-side; hidden buttons are not authorization.

### 17. Client-facing calendar/booking interaction

Client booking remains service/practitioner/date/time oriented through existing booking flows. The first Calendar foundation does not expose a client-editable calendar. Future client calendar views may project canonical appointments and existing actions, but must delegate mutation to existing booking/reschedule/cancel owners.

### 18. Shared + practitioner Google Calendar mirroring

Google Calendar remains a synchronized integration during migration. Existing shared and practitioner mirror writes, updates, deletes, compensation/recovery and provider-health gates remain in place. A missing/failed mirror must be observable and recoverable without redefining canonical Shiloh appointment truth.

## Proposed Shiloh Calendar architecture

### A. Canonical data model

Do **not** create a parallel `calendar_events` table as a second mutable source of scheduling truth.

Use existing canonical domain tables as sources:

- `appointments`
- `appointment_staff`
- appointment service snapshots / booking metadata
- staff/service eligibility mappings
- staff working hours and scheduling classification
- clinic/location working hours
- location/holiday exceptions
- staff schedule exceptions / closures
- `calendar_blocks`
- leave request/workflow state where approved leave becomes scheduling truth
- appointment status/history and CRM audit
- Google mirror identifiers/status metadata already associated with appointments/integration state

Introduce a **derived Calendar projection boundary**, conceptually `SchedulingTimeline`, whose items are typed projections, not new canonical business objects:

- `appointment`
- `block`
- `leave`
- `clinic_closure`
- `working_window`
- `external_google_busy`
- optional future `hold` where an existing canonical hold primitive is explicitly included

Every projected item must include:

- stable source type + source ID;
- start/end;
- practitioner/resource scope;
- business status;
- mutability owner;
- visibility/permission metadata;
- conflict semantics;
- mirror/provider health metadata where applicable.

The projection must be rebuildable from canonical sources. Deleting/rebuilding projection data must never delete business truth.

### B. Scheduling / availability engine boundary

Create a single internal boundary, recommended name: **`schedulingEngine`**.

Responsibilities:

- canonical availability computation;
- conflict classification;
- practitioner/resource intersection for multi-staff bookings;
- explainability: why a period is available/unavailable;
- timeline projection for Calendar UX;
- final recheck APIs used by existing booking/reschedule/cancel owners.

Migration principle: initially wrap/delegate to existing `availabilityService`, `clientBookingAvailability`, Google conflict classification and current guards. Do not rewrite algorithms in the first slice.

The key design rule is **one scheduling engine, multiple consumers**: WhatsApp client booking, Admin booking, future web Calendar and diagnostic/parity tooling must not develop separate conflict logic.

### C. Calendar UX model

The Calendar UX should be operationally useful without becoming an unsafe mutation surface.

Recommended views:

- **Day** — practitioner lanes, precise operational scheduling;
- **Week** — practitioner lanes, availability and workload planning;
- **Agenda** — compact appointment/block/leave list;
- later: clinic/resource view if actual resource constraints are introduced.

Each item should visually distinguish:

- appointment lifecycle state;
- block/time off;
- approved leave;
- clinic closure/public holiday;
- external Google-only busy conflict;
- mirror warning/degraded synchronization.

First UX is **read-only**. Item detail should link/delegate to existing Manage booking / existing guarded action owners rather than duplicate mutation semantics.

### D. Practitioner and business-admin permissions

Authorization is evaluated from Shiloh identity and current role/permission contracts.

Recommended model:

- practitioner: view own canonical schedule, own relevant blocks/leave, permitted client/appointment detail;
- practitioner with explicit existing cross-practitioner booking scope: view only the additional scope already authorized;
- business admin: broader clinic operational visibility only where existing business-admin authority permits it;
- attendance/finalization, block-time, schedule-management and booking mutation remain **separate capabilities**;
- no new Calendar-wide superuser permission should silently collapse these distinctions.

Future Calendar mutation actions must call the canonical owner and re-evaluate permission at mutation time.

### E. Audit/history model

Calendar itself must not invent lifecycle history.

Future Calendar-native commands should write through canonical services and produce:

- existing appointment status/history where appointment state changes;
- CRM/business audit where currently required;
- scheduling audit for schedule/block/leave mutations;
- provider synchronization attempts/outcomes separately from business-state history.

Recommended additional observability layer: immutable **calendar operation telemetry** for sync/parity/recovery, explicitly non-authoritative for business state.

### F. Google Calendar coexistence / mirror model

Migration state should be explicit per capability:

1. **Shiloh canonical business state** — appointments/schedules/blocks/leave/closures.
2. **Google external busy input** — still consulted under current conflict semantics.
3. **Google output mirror** — shared + assigned-practitioner event synchronization.
4. **Provider health** — observable, fail closed where current flows require it.

Do not treat Google event edits as silently authoritative Shiloh appointment edits.

During coexistence, external Google-only busy events remain conflict inputs; Shiloh-owned appointment mirrors remain outputs. If later bidirectional reconciliation is desired, it requires a separate explicit authority contract and provenance rules.

### G. Migration phases

#### Phase 0 — behavioural freeze and design authority

This document. No runtime change.

#### Phase 1 — read-only scheduling projection

Build `schedulingEngine` facade + `SchedulingTimeline` read model by delegating to current sources. No mutation path changes. No Google behavior changes.

#### Phase 2 — internal Shiloh Calendar read-only UX

Expose Day/Week/Agenda for authenticated Admin/practitioner users with strict role-scoped data. Existing booking/manage flows remain mutation owners.

#### Phase 3 — parity instrumentation

For the same date/resource windows, compare Calendar projection, existing booking availability and Google conflict outcomes. Record divergence without auto-correcting business state.

#### Phase 4 — guarded Calendar actions by delegation

Add carefully selected actions such as open/manage appointment or create block only by calling already-authoritative services. No drag/drop direct mutation.

#### Phase 5 — Shiloh-first operational scheduling

After parity/reliability proof and Control authorization, operational staff may rely primarily on Shiloh Calendar while Google remains mirror + external busy integration.

#### Phase 6 — reassess Google optionality

Only after measured production reliability, sync recovery, provider-failure behavior and operational acceptance. Any reduction/removal of Google conflict authority is a separate Control decision.

### H. Rollback / fail-closed strategy

- Phase 1/2 must be feature-gated and read-only; disabling the Calendar leaves all existing booking flows unchanged.
- No canonical source is migrated or deleted in early phases.
- Projection failures return Calendar unavailable/degraded; they do not fall back to guessed availability.
- Existing booking flows continue using current canonical availability and Google guards until explicitly migrated.
- Google mirror failure remains visible and recoverable; no appointment truth is rolled back merely because a mirror UI is unavailable.
- Any future mutation delegation must fail closed if canonical owner, authorization, conflict recheck or provider requirement cannot be satisfied.
- No schema migration may transform/delete historical appointments merely to support the Calendar UI.

## Exact first implementation slice — recommended

**Slice name: `SHILOH-CALENDAR-READONLY-PROJECTION`**

Build a read-only server-side scheduling projection and parity test harness behind a default-off feature flag.

Scope:

1. Add `src/services/schedulingEngine.js` as a facade over current authoritative availability/conflict owners; initially delegate rather than rewrite.
2. Add a `listTimeline({from,to,viewer,staffIds})` read contract that projects:
   - canonical appointments + `appointment_staff`;
   - `calendar_blocks`;
   - effective staff/clinic working windows and exceptions;
   - approved leave/unavailability only through existing authoritative state;
   - current Google external-busy classification as a distinct non-canonical item type.
3. Add permission filtering using existing Admin/staff identity and scope rules.
4. Add deterministic tests proving projection does not mutate DB/provider state and that appointment/block/conflict visibility matches existing authority.
5. Add parity tests against existing availability for representative single-staff and multi-staff windows, including PR #395 unrelated-practitioner Google-event classification.
6. Do **not** add a production Calendar page yet unless Control separately authorizes the UI surface in the same unit. The first implementation goal is a safe, testable domain boundary.

Why this slice first:

- lowest migration risk;
- forces scheduling semantics into one explicit boundary before UI coupling;
- gives parity evidence without changing bookings;
- provides the foundation for Day/Week/Agenda later;
- can be disabled/removed with zero business-data rollback;
- preserves Google mirroring and current fail-closed behavior.

## Material trade-offs and recommendation

### Option 1 — Build a new calendar/events database first

Reject. It creates dual truth and immediate reconciliation risk.

### Option 2 — Build a visual Calendar directly over ad hoc queries

Reject. It would encode a second scheduling interpretation in the UI and make later mutation unsafe.

### Option 3 — Introduce a scheduling facade + derived read model over existing canonical sources

**Recommended.** This is what I would choose for Shiloh OS.

The material trade-off is that the first visible product increment is smaller: domain consolidation and parity precede a rich UI. That delay is worthwhile because Calendar is a high-risk scheduling surface; a fast visual implementation over duplicated logic would make later Google deprecation more dangerous, not less.

## Decision timing and priority

Recommendation: **do now**, as the immediate next major Booking & Admin UX priority after the completed Goldie publication programme.

Priority sequence:

1. Freeze behavioural contract — complete in this unit.
2. Control ratifies architecture/migration sequence.
3. Booking & Admin UX builds `SHILOH-CALENDAR-READONLY-PROJECTION`.
4. Production & DevOps supports infrastructure/performance/observability if required.
5. Read-only UX + parity proof.
6. Guarded delegated actions.
7. Only later consider Google optionality.

## Explicit non-authorizations

This design document does **not** authorize:

- replacing Google Calendar production behavior;
- changing provider conflict rules;
- bulk migration of appointments/schedules/blocks/leave;
- changing practitioner working hours or clinic hours;
- creating, editing, cancelling or rescheduling appointments;
- creating/removing blocks or leave;
- removing shared/practitioner Google mirrors;
- bidirectional Google-to-Shiloh appointment editing;
- drag-and-drop appointment mutation;
- reducing any current fail-closed guard.

Any such change requires a later controlled implementation authority.