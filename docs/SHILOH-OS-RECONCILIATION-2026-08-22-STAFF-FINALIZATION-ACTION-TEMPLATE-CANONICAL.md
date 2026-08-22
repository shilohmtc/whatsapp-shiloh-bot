# Shiloh OS — Reconciliation — Canonical Staff Finalization Action Template

Date: 2026-08-22
Owning implementation workstream: 30 — WhatsApp & Meta Integration
Required UX consumer: 10 — Booking & Admin UX
Reconciliation owner: 00 — Control & Reconciliation
Status: VERIFIED LIVE / COMPLETE

## Authoritative outcome

The recurring actionable staff-finalization reminder path now canonically uses the already provider-approved WhatsApp Utility template:

`shiloh_staff_finalization_actions_v1`

with exactly one Quick Reply:

`Finalize past visits`

and payload:

`admin_action_finalize`

The prior text-only `shiloh_staff_finalization_v1` is no longer the canonical template for actionable recurring end-of-day / next-morning attendance-finalization reminders.

## Evidence chain

Implementation PR:
- PR #420 — **Use action template for recurring staff finalization reminders**
- PR head: `7fc667551256d53861819826ed29e718d4eb4926`
- Merge: `824d7ecb7a784714c81c00fc2d3f716c1e3e892e`

CI:
- CI #1280
- Workflow run: `32574955897`
- Test job: `97035809731`
- Node: `24.14.1`
- Full non-mutating regression: **882 passed / 0 failed / 0 cancelled / 0 skipped**
- Relevant regression explicitly proves:
  - recurring reminders are action-template gated;
  - every actionable recurring reminder sends the canonical finalization quick reply;
  - the recurring scheduler activates only after Meta reports APPROVED;
  - the action template is canonical for actionable recurring reminders.

Production:
- Render service: `srv-d9qbfmk9v7es73emgam0`
- Deploy: `dep-da4pvc3ncjis7386nhbg`
- Trigger: `new_commit`
- Exact commit: `824d7ecb7a784714c81c00fc2d3f716c1e3e892e`
- Status: `LIVE`
- Finished: `2026-08-22T13:10:43.420626Z`

Provider/runtime verification:
- `shiloh_staff_finalization_actions_v1` returned provider status `APPROVED` and category `UTILITY` during production startup.
- `Shiloh started` was logged successfully.
- Production health returned HTTP 200.
- The live scheduler logged:
  - `templateName=shiloh_staff_finalization_actions_v1`
  - `scanMinutes=15`
  - `endOfDayHour=19`
  - `nextMorningHour=8`
  - `Attendance finalization action reminder scheduler started`

## Preserved authority

PR #420 changes presentation/transport selection only for actionable recurring staff-finalization reminders. It preserves:

- Christel / Abigail / Marietjie recipient authority;
- `certificationStaffIds` practitioner scope;
- own-practitioner attendance-finalization authority;
- Johannesburg end-of-day and next-morning timing;
- canonical pending-count calculation;
- one reminder per Admin / clinic date / reminder kind;
- undo-on-send-failure behavior;
- provider approval fail-closed behavior;
- the existing `admin_action_finalize` workflow;
- the rule that attendance is never inferred automatically.

The old `WHATSAPP_STAFF_FINALIZATION_TEMPLATE` override no longer selects the recurring actionable reminder template. This is deliberate: the action-bearing template is the canonical transport for this specific operational reminder path.

## Explicit non-mutations / do not redo

This unit did **not**:

- recreate, edit, duplicate or resubmit the Meta template;
- add or replay a database migration;
- mutate appointments;
- infer or mutate attendance;
- clear or rewrite the historical finalization prompt ledger;
- manufacture a WhatsApp reminder;
- manufacture a booking/finalization journey;
- create a fake Calendar event or CRM record merely for proof.

Do not repeat those actions for reconciliation evidence.

## Natural handset evidence

A future genuine actionable staff-finalization reminder may provide handset evidence that `Finalize past visits` renders as a WhatsApp button.

That evidence is **observe-only** and **not a blocker** to VERIFIED LIVE / COMPLETE status. Do not manufacture operational state solely to obtain it.

## Relationship to newer and unrelated authority

Current `main` at the start of this reconciliation is `824d7ecb7a784714c81c00fc2d3f716c1e3e892e` and includes the separate PR #419 universal premium first-contact implementation in its ancestry. This reconciliation does not modify or supersede that CRM presentation work.

PR #416 remains durable verified-client identity authority; PR #399/migration 072 remains durable normalized-phone ambiguity repair authority; PR #395 remains durable practitioner Google Calendar conflict-classification authority; PR #411 remains the bounded production Postgres observation exception. None is reopened by this unit.

Open Goldie exact-source-first policy PR #415 is separate and must not be conflated with this unit.

## Reconciliation disposition

The canonical action-button staff-finalization reminder implementation is accepted as **VERIFIED LIVE / COMPLETE**.

No further WhatsApp/Meta, Booking/Admin, CRM, attendance, appointment, database or provider mutation is authorized or required by this reconciliation.

Project Tracker and Master Status should treat:

- PR #420 / `824d7ecb7a784714c81c00fc2d3f716c1e3e892e` as the current overall application baseline at this checkpoint;
- CI #1280 / 882 of 882 passing as the current regression evidence;
- `dep-da4pvc3ncjis7386nhbg` as the exact verified-live production deploy;
- `shiloh_staff_finalization_actions_v1` as the canonical recurring actionable staff-finalization template;
- natural handset button rendering as non-blocking evidence-to-observe.

## Next Control priority

A separate reconciliation discrepancy exists outside this unit: PR #419 (**Apply premium greeting to every first identity contact**) is already merged into production lineage while its documentation-only authorization PR #418 remains open/unmerged. Control should reconcile that #418/#419 authority mismatch next, without changing the already-live identity semantics or manufacturing a client journey.
