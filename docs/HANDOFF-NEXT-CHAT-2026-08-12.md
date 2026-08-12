# Shiloh OS — Production Handoff — 12 Aug 2026

This is the authoritative next-chat entry point as of the end of the current working session. Treat GitHub `main`, Render production, Shiloh CRM and Google Calendar as authoritative over older notes or chat history.

## Authoritative current production state

- GitHub `main`: `e19c94b82ebc7feeacab46fda4729c76e2c67512` after PR #148.
- Render production deploy: `dep-d9u7p167bikc739nsn70`, live on the exact commit above.
- Production health checks are returning HTTP 200.
- Render service remains `shiloh-whatsapp-bot`, branch `main`, auto-deploy enabled.
- CRM remains authoritative for appointment identity/status, clients, services, practitioner mappings, reporting and earnings truth.
- Google Calendar remains authoritative diary/conflict/mirror infrastructure, but a calendar event alone never proves attendance/completion.
- Safe engineering rule remains mandatory: non-mutating/self-test first; never infer attendance, payment or client truth merely to make a test pass.

## Major work completed in this session

### Admin booking / no-slot UX

- Shared Admin booking flow now has a bounded `Check next available` action when a chosen date has no slots.
- It searches forward through the canonical availability engine, preserves the selected service/practitioner, never invents availability and performs no booking/calendar mutation during search.
- Shared fix applies to authorized Admins generally rather than Jean-Pierre-only patches.

### Attendance finalization authority

Attendance is explicit human truth. A past appointment does **not** become `completed` merely because its time elapsed.

Live certification authority is:

- Marietjie -> may finalize Marietjie appointments only.
- Abigail -> may finalize Abigail appointments only.
- Christel -> may finalize Christel + Abigail appointments.
- Jean-Pierre -> business-wide review visibility only; no routine Completed/No-show certification authority.

`Finalize past visits` now shows the responsible practitioner's actual certifiable queue and asks simply what happened. Writes remain server-side authority checked, row-locked, transactional and audited. Finalization updates canonical appointment status, status history, appointment lifecycle and CRM audit evidence.

### Proactive attendance-finalization reminders

- End-of-day / next-morning reminder scheduler is implemented with bounded reminder windows.
- It is WhatsApp-template gated and fail-closed; no free-form proactive WhatsApp is used.
- Managed Meta template: `shiloh_staff_finalization_v1` (UTILITY).
- Last observed Meta provider state: `PENDING`; no manual override is configured.
- Automatic provisioning/status discovery exists, so once Meta reports the managed template `APPROVED`, the scheduler can activate without manually setting a template environment variable.
- Until approval, reminder sending remains safely inactive.

### Historical attendance correction — Christel + Abigail

The user explicitly confirmed the correction scope as **1–8 August 2026 inclusive, Christel and Abigail only**.

A proof-bound one-time production correction identified 29 exact calendar-linked CRM appointments in that date/practitioner scope and applied:

- 29 -> `completed`
- 0 already completed
- 0 cancelled
- 0 no-show

Each change wrote canonical status history, lifecycle synchronization and CRM audit evidence. The one-time startup maintenance hook was subsequently removed; it is not part of normal production startup.

Do **not** extend that historical completion assumption beyond 8 August. Any later unresolved visit requires explicit practitioner/supervisor attendance truth.

### Earnings reporting

All earnings reports are completed-only and fail closed around unresolved attendance, joint-practitioner attribution or missing CRM prices.

#### Abigail

Business rule remains:

- 20% commission on qualifying completed solo treatment value.
- R5,000 fixed monthly salary in the monthly view only.
- No salary proration in shorter periods.

The Reports route now opens the real period picker rather than silently defaulting to Today: Today / This Week / Last Week / This Month.

Last user-observed August snapshot after the 1–8 Aug correction:

- 19 completed solo appointments
- R11,800 completed treatment value
- R2,360 commission at 20%
- R5,000 monthly salary
- R7,360 total gross compensation
- 2 pending finalizations
- status PROVISIONAL

These figures are a snapshot, not a frozen ledger; re-query CRM after pending attendance is resolved.

#### Christel

Business rule remains:

- 100% of qualifying completed solo treatment value.
- Clinic-wide revenue and other practitioner earnings remain separate.

Last user-observed August snapshot:

- 10 completed solo appointments
- R5,460 completed treatment value
- R5,460 Christel treatment earnings
- 4 pending finalizations
- status PROVISIONAL

Again, re-query after pending visits are resolved.

#### Marietjie

Business rule explicitly confirmed by the user and now encoded:

- 100% of qualifying completed solo treatment value.
- No fixed salary.

`Marietjie earnings` supports Today / This Week / Last Week / This Month and the same Pending finalization + FINAL/PROVISIONAL integrity model.

Authorized viewers are now:

- Marietjie -> self-view of her own earnings, bound to her canonical `staff_id`.
- Christel -> may view Marietjie earnings.
- Jean-Pierre -> may view Marietjie earnings.
- Abigail -> no access to Marietjie earnings.

PR #148 made Marietjie's self-view live.

### Earnings period UX

Reports -> Abigail earnings / Christel earnings / Marietjie earnings uses an explicit period picker. Do not interpret a Today report as an August/monthly report.

### Repository housekeeping note

During branch setup for PR #148, two accidental placeholder files were briefly committed to `main` and immediately removed. Current `main` contains neither placeholder. The authoritative production tree is the PR #148 merge commit stated above.

## Current human-truth backlog

At the last user-visible August reports there were **6 unresolved attendance records** affecting earnings:

- Abigail: 2 pending finalizations.
- Christel: 4 pending finalizations.

The 1–8 August appointments were already canonicalized, so these six must **not** be auto-completed under the earlier confirmation. Surface them through the live Finalize past visits workflow and obtain explicit Completed / No-show (or preserve unresolved if genuinely unknown) from the authorized practitioner/supervisor.

Marietjie's own August pending-finalization count has not yet been production-accepted by the user; verify it through her report/finalization queue rather than assuming zero.

## External blockers still preserved fail-closed

### Staff attendance reminder Meta template

🟡 `shiloh_staff_finalization_v1` — last observed `PENDING`. Re-check provider state read-only. Do not force-enable or use free-form proactive messages.

### Birthday template

🟡 `shiloh_birthday_wish_v2` — last known Meta state `PENDING`; `WHATSAPP_BIRTHDAY_TEMPLATE` remains unset and birthday sending remains disabled. Re-check read-only before making any claim that it is approved. Do not enable unless provider status is positively `APPROVED` and current brand copy still passes verification.

### P4 payments / Ozow / vouchers

🟡 Architecture foundation is complete and deliberately feature-off. Preserve payment activation fail-closed until the real Ozow merchant/account configuration and Shiloh business policy are explicitly known and sandbox-tested. Payment truth remains a separate state machine from booking, attendance, calendar and loyalty truth. See `docs/P4-PAYMENTS-ARCHITECTURE.md`.

## New prioritized checklist — remaining work only

Legend: **🟡 = waiting on external/human truth or safely blocked**; **⬜ = genuinely unfinished and actionable engineering/verification**.

1. 🟡 **Resolve the six known Christel/Abigail attendance finalizations.** Abigail (2) and Christel (4) remain human-truth dependent. Do not infer outcomes. Use the live practitioner-owned `Finalize past visits` workflow; Christel may also certify Abigail's visits.

2. ⬜ **Complete production acceptance of earnings/finalization UX.** Verify the simplified Finalize past visits flow from the actual practitioner Admin accounts; then re-run Abigail and Christel `This Month` reports after the six records are resolved and confirm `Pending finalization: 0` / `FINAL` where appropriate. Also test Marietjie -> Admin -> Reports -> Marietjie earnings -> This Month and inspect any Marietjie pending visits through her own queue. Fix only genuine defects found.

3. 🟡 **Activate proactive staff finalization reminders only after Meta approval.** Re-check `shiloh_staff_finalization_v1`. If still `PENDING`, preserve disabled state and continue to the next actionable item. If `APPROVED`, verify the scheduler activates through the managed-template path and perform a safe non-client production check before relying on it operationally.

4. ⬜ **Run the remaining Admin/client route acceptance audit against current PR #148 production.** Do not redo route coverage already regression-locked. Concentrate only on genuinely unfinished real-WhatsApp paths surfaced by production use: Admin section -> action -> guarded owner -> back/menu escape, including role-specific visibility for Christel, Abigail, Marietjie and Jean-Pierre. Fix shared routing defects at the shared layer.

5. 🟡 **Birthday automation approval.** Re-check Meta provider state for `shiloh_birthday_wish_v2`; keep sending disabled while `PENDING`.

6. 🟡 **P4 payments/Ozow activation gate.** Architecture is complete but real activation is blocked on actual Ozow merchant integration/account configuration plus explicit Shiloh rules for payable amount/deposit/full payment, refunds and Shiloh-issued gift vouchers. Do not infer these business rules.

7. ⬜ **Once higher-priority acceptance work is clean, resume the next genuinely actionable P4 engineering slice that does not require unknown provider/business facts.** Any provider/data mutation remains feature-off until item 6 is satisfied. Prefer contracts, reconciliation/idempotency tests, sanitized observability and sandbox-safe work over live payment activation.

## Recommended next-chat execution rule

Start with the highest-priority **⬜ actionable** item. If an earlier 🟡 item can be resolved safely through a read-only provider check or explicit practitioner response, update its state; otherwise preserve its fail-closed state and continue rather than waiting.

For the current ordering, item **#2** is the highest-priority genuinely actionable item. It should be completed around the human-truth dependency in #1: safely verify the new finalization/earnings UX and surface the exact pending practitioner records without guessing their outcomes. If practitioner confirmation is unavailable, preserve those records pending and continue to item #4.

## Safe self-test-first engineering rule

1. Inspect current GitHub `main`, Render live deploy and relevant CRM/Calendar truth before changing anything.
2. Use non-mutating regression tests and read-only/synthetic checks first.
3. Put code changes on an isolated branch/PR; require green CI before merge.
4. Let Render auto-deploy `main`; verify exact commit, startup and `/health` after merge.
5. Never send unnecessary real-client messages or mutate genuine appointments merely to test.
6. Never infer attendance, payment, cancellation, identity or earnings truth.
7. When a production defect affects a shared path, fix it at the shared authorization/routing/data layer rather than patching one Admin account unless evidence proves it is account-specific.

## Start here in the next chat

Paste:

**Shiloh OS**

Continue the Shiloh OS production project from `docs/HANDOFF-NEXT-CHAT-2026-08-12.md`.

Treat GitHub `main`, Render production, Shiloh CRM and Google Calendar as authoritative. Do not redo completed work. Apply the safe self-test-first engineering rule automatically.

Read the **New prioritized checklist — remaining work only**. Start with the highest-priority genuinely actionable **⬜** item. If an earlier **🟡** item is externally/human blocked, preserve its fail-closed state and continue automatically. Before changes, briefly state the authoritative current state, the checklist item being started, and why it is next; then proceed.
