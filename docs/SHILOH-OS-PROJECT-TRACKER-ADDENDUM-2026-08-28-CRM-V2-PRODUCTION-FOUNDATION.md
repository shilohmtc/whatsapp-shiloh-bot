# Shiloh OS Project Tracker Addendum — 2026-08-28 — Clean CRM V2 Production Foundation

Controlled unit: `SHILOH-CLEAN-CRM-V2-PRODUCTION-FOUNDATION-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **RECONCILED — NEXT P0 ROUTED**

## Terminal production sequence

The production migration sequence required to make the Clean CRM V2 foundation physically available is complete.

| Issue | Controlled unit | Owner | Terminal state | Do not redo |
|---|---|---|---|---|
| #523 | `SHILOH-PRODUCTION-MIGRATION-LEDGER-RECONCILIATION-P0` | 40 — Production & DevOps | PASS / CLOSED | Yes |
| #525 | `SHILOH-PRODUCTION-MIGRATION-LEDGER-REPAIR-P0` | 40 — Production & DevOps | PASS / CLOSED | Yes |
| #522 | `SHILOH-CLEAN-CRM-V2-PRODUCTION-MIGRATION-084-P0` | 40 — Production & DevOps | PASS / CLOSED | Yes |

Accepted terminal database state from #522:

- migration files: **88**;
- `schema_migrations`: **88**;
- pending migrations: **0**;
- checksum mismatches: **0**;
- ledger rows absent from deployed release: **0**;
- `crm_v2_clients`: present and empty;
- `appointments.crm_v2_client_id`: present, nullable `bigint`;
- appointments with non-null `crm_v2_client_id`: **0**;
- legacy business-data invariants and appointment #592 unchanged;
- terminal production health: HTTP 200 / database ok.

Release reference independently reconciled by 00 immediately after #522:

- GitHub `main`: `d7b132adc327abd56afa5f08f62a8e1734abc4f2`;
- tree: `da4459600247dd5174f0f3e3647cbe7109f7ade7`;
- Render deploy: `dep-da8ac2ek1f9s73f5o9eg`;
- Render deployed SHA: `d7b132adc327abd56afa5f08f62a8e1734abc4f2`;
- deploy status: live.

## Current active P0

Issue #526 — `SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0`

Owner: **10 — Calendar & Booking Assurance**  
Executor: **Shiloh OS — WS-10 — Calendar Clean CRM V2 Cutover P0**  
State: **ACTIVE / ENGINEERING ROUTED**

Objective:

Move new Shiloh Calendar booking client resolution and new appointment linkage onto the clean CRM V2 domain boundary without importing/backfilling legacy clients and without creating a permanent dual-master client design.

Governing cutover contract:

- CRM V2 domain service is the only V2 client-resolution boundary;
- exact normalized mobile is the only automatic identity key;
- new V2 appointments write `crm_v2_client_id` and leave legacy `client_id` null;
- existing appointments remain on their current legacy pointer/snapshots;
- Calendar owns deliberate final-mobile acknowledgement before confirmation messaging;
- WhatsApp registration cutover remains a later separate controlled unit.

## Reconciled adjacent issues

### #524 — Create Booking label simplification

State: **CLOSED / NOT PLANNED AS STANDALONE**

Reason: superseded by #526. The approved product decision remains mandatory in the canonical CRM V2 booking surface:

`Find client | New client`

No separate top-level `Client registration` button.

### #512 — Shiloh-only Calendar authority / Google decommission engineering

State: **CLOSED / COMPLETE**

The Shiloh-only scheduling-authority engineering/runtime tranche was implemented through merged PR #513 and must not be redone.

Physical Google provider/environment disconnection was explicitly outside the engineering package and remains **not done**. Because destructive provider disconnection is a retained owner-level gate, any future physical provider retirement must be a fresh 40-controlled unit with explicit JP authorization. It is not an active P0 while Google is already removed from normal scheduling authority.

## Stabilization sequence

Current priority sequence:

1. **#526 — Calendar ↔ Clean CRM V2 cutover for new bookings.**
2. Reconcile/release/production-prove #526, including any separately required additive production migration.
3. **WhatsApp ↔ Clean CRM V2 registration cutover** as a separate 30-owned unit.
4. Only after Calendar and WhatsApp V2 paths are proven: evaluate retirement of superseded legacy CRM/identity runtime dependencies.
5. Physical Google provider disconnection remains a separate JP-only retirement decision, not an implementation prerequisite.

No unrelated P0/P1 surface work should interrupt this spine unless it removes a blocker, reduces a real dependency, or remediates a genuine production/security risk.
