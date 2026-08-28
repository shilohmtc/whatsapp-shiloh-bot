# Shiloh OS Control Cockpit Addendum — 2026-08-28 — CRM V2 Production Foundation

Controlled unit: `SHILOH-OS-CONTROL-COCKPIT`

Owner: **00 — Control & Reconciliation**

Status: **CURRENT CHECKPOINT**

This addendum is the current 2026-08-28 Cockpit projection and supersedes the 2026-08-27 stabilization checkpoint in `SHILOH-OS-CONTROL-COCKPIT.md` for live sequencing. The base Cockpit remains the governing format/authority model.

## Current operational spine

**Shiloh Calendar → Clean CRM V2 → WhatsApp communications / client registration**

## Current workstream projection

| Stream | State | Current unit / authority | Current gate | Next owner |
|---|---|---|---|---|
| **00 — Control & Reconciliation** | ✓ RECONCILED | #523 / #525 / #522 production migration sequence terminal PASS; #526 routed | Merge this documentation-only reconciliation; then await #526 Draft PR return | WS-10 |
| **10 — Calendar & Booking Assurance** | ▶ ACTIVE | #526 `SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0` | Draft PR engineering only; no merge/deploy/production mutation authority | WS-10 |
| **20 — CRM & Identity** | ✓ FOUNDATION COMPLETE / FROZEN | PR #515 + production migration #522; CRM V2 schema live/empty | No separate implementation until a CRM-domain defect blocks #526 | 10 consumes canonical V2 service |
| **30 — WhatsApp & Meta Integration** | ○ IDLE FOR CRM V2 | WhatsApp ↔ CRM V2 registration cutover deliberately sequenced later | Wait for Calendar V2 cutover proof | 00 after #526 |
| **40 — Production & DevOps** | ✓ #522 COMPLETE / IDLE | Ledger 88/88; CRM V2 schema present; zero pending migrations | Called only if #526 release introduces a separate production migration/deploy proof gate | 00 routes when needed |

## Production foundation checkpoint

Immediately after #522 terminal reconciliation:

- GitHub main: `d7b132adc327abd56afa5f08f62a8e1734abc4f2`;
- tree: `da4459600247dd5174f0f3e3647cbe7109f7ade7`;
- Render deploy: `dep-da8ac2ek1f9s73f5o9eg`;
- deployed SHA: `d7b132adc327abd56afa5f08f62a8e1734abc4f2`;
- migration ledger: **88 / 88**;
- pending migrations: **0**;
- `crm_v2_clients`: present / **0 rows**;
- `appointments.crm_v2_client_id`: present / nullable / **0 populated appointments**;
- terminal health: HTTP 200 / database ok.

Any later release decision must re-read current machine state rather than treating this snapshot as perpetual authority.

## DO NOT REDO

- #523 migration-ledger reconciliation;
- #525 migration-ledger repair;
- #522 migration 084 production application;
- #512 Shiloh-only Calendar scheduling-authority engineering.

## #526 active contract

The active P0 is **Calendar Clean CRM V2 cutover for new bookings**.

Key boundaries:

- use canonical `crmV2ClientService` only for V2 client resolution;
- exact normalized mobile is the only automatic identity key;
- new V2 appointments use `crm_v2_client_id` with legacy `client_id` null;
- existing appointments remain on legacy pointers/snapshots;
- no legacy import/backfill or shadow-client dual write;
- Calendar-owned final-mobile acknowledgement before confirmation messaging;
- preserve durable exactly-once booking-confirmation semantics;
- no WhatsApp registration cutover in #526;
- no legacy CRM retirement in #526.

## Reconciled queue cleanup

- #524 is CLOSED / `not_planned` as a standalone unit; its `Find client | New client` decision is absorbed into #526.
- #512 is CLOSED / `completed`; physical Google provider disconnection remains NOT DONE and is a future fresh JP-only retirement gate, not current P0.

## Exactly what JP does next

After this checkpoint is merged, JP should route issue #526 to:

`Shiloh OS — WS-10 — Calendar Clean CRM V2 Cutover P0`

No other approval or reconstruction is required. WS-10 must stop at Draft PR / verified engineering return and bring that evidence back to 00.
