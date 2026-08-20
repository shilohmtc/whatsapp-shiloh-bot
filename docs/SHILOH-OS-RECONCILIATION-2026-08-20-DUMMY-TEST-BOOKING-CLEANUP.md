# Shiloh OS — Reconciliation — Dummy Test booking cleanup

Date: 2026-08-20
Owning workstream: Booking & Admin UX
Status: VERIFIED LIVE / CONTROLLED CLEANUP COMPLETE

## Scope

Cancel and clean operational bookings still tied to the already archived/reset Dummy Test CRM identity without deleting appointment history, falsifying finalized attendance outcomes, sending customer WhatsApp messages, or touching the reassigned phone identity.

Exact target authority remains **CRM client #835**. The earlier number-reassignment reset archived this client, released its WhatsApp/mobile binding and intentionally preserved appointment history. This cleanup is a separate controlled action.

## Pre-cleanup evidence

The external Render Postgres read connector remained unavailable because its SSL/TLS boundary fails before SQL execution. No row truth was inferred from that failed connector and no write-capable workaround was used as read-only verification.

Independent Google Calendar searches across the 2026 calendar year found exactly two active Dummy Test booking mirrors on the shared booking calendar:

- appointment **#582** — Facial Lymphatic Drainage Massage — Dummy Test — Abigail — 20 Aug 2026 12:00–13:00 SAST;
- appointment **#583** — Pelvic Floor Strengthening — Dummy Test — Marietjie — 20 Aug 2026 12:00–12:30 SAST.

Both event IDs deterministically resolved to those appointment IDs through Shiloh's canonical `shiloh-appointment:<id>` Google event-ID contract. Matching practitioner mirrors were present on Abigail and Marietjie calendars.

## Guarded cleanup implementation

PR #362, **Clean up archived Dummy Test bookings safely**, merged as `1fdf1a2d183d061a1dee64e46de5299fbecde992` after GitHub Actions CI **#1152** completed successfully.

The cleanup is an explicit one-shot startup action behind `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START`, default **false**. Before any mutation it requires:

- exact client ID **835**;
- display name `Dummy Test` or `CRM Dummy Test`;
- client status `inactive`;
- completed `custom_attributes.test_client_reset=true` marker;
- zero remaining WhatsApp/mobile bindings.

Non-final appointment statuses are changed to canonical `cancelled` with appointment status history and system CRM audit evidence. Already `cancelled`, `completed` and `no_show` rows are not rewritten. The cleanup also terminalizes operational pending state for the target appointments, cancels appointment lifecycle reminder state and suppresses pending/failed customer-change notification rows without creating a cancellation-notification delivery.

Calendar cleanup uses deterministic appointment event identity and cancels the shared and practitioner mirrors. Startup fails closed if a target Calendar mirror remains unresolved while the one-shot is enabled.

## Production execution

Default-off deploy `dep-da3dj58ae00c73fvs1k0` reached **LIVE** on exact #362 merge before activation.

The user-authorized execution then set only:

`CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START=true`

Activation deploy `dep-da3djhuk1f9s73em4td0` reached **LIVE**. Production startup evidence at 12:41:47 SAST established:

- exact target `clientId=835` passed all identity/reset/contact guards;
- newly cancelled appointment IDs: **#582, #583**;
- preserved existing final/history rows:
  - **#561** — already cancelled;
  - **#564** — no-show, preserved as finalized historical truth;
  - **#565** — already cancelled;
  - **#566** — already cancelled;
  - **#574** — already cancelled;
- related operational-state cleanup:
  - pending booking approvals changed: **0**;
  - pending/failed reschedule requests changed: **0**;
  - appointment lifecycle rows terminalized: **3**;
  - pending/failed customer-change notifications suppressed: **0**;
- all shared/practitioner Calendar cleanup results were successful;
- `unresolvedCalendarIds=[]`.

The cleanup did not create or delete client identity, did not delete appointment records, did not rewrite #564's no-show truth, and did not queue/send a client cancellation message.

## Independent Calendar verification

After production cleanup, independent 2026-wide `Dummy Test` searches returned **zero events** on all four relevant Google Calendar surfaces:

- shared Shiloh booking calendar;
- Abigail practitioner calendar;
- Marietjie practitioner calendar;
- primary/Christel calendar.

This independently confirms that no Dummy Test booking mirror remains on the current Google Calendar surfaces.

## One-shot closed

Immediately after successful verification, `CRM_DUMMY_APPOINTMENT_CLEANUP_ON_START` was returned to **false**. Final flag-off deploy **`dep-da3dk36k1f9s73em616g`** reached **LIVE** on the same #362 application commit.

Do not re-enable this one-shot merely to reproduce evidence. CRM #835 remains archived/reset. Appointment #564 remains historical no-show truth; the other preserved rows were already cancelled. Appointments #582 and #583 are now canonically cancelled.

## Preserved unrelated gates

This cleanup does not alter practitioner Block time authority, Juvan booking approval evidence, practitioner-approved client reschedule Meta/provider activation gates, booking-confirmation template state, booking-update evidence gates, own-practitioner attendance authority, appointment #558 HOLD, Google Calendar fail-closed booking guard, GBP, Ozow, privacy, Visual Calendar or Goldie-description gates.

## Reconciliation result

Dummy Test operational booking cleanup is **complete**. There are no remaining Dummy Test Calendar booking mirrors in the independently searched 2026 shared/practitioner surfaces, and the one-shot execution flag is back **off**.
