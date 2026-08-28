# Shiloh OS Master Status Addendum — 2026-08-28 — Clean CRM V2 Production Foundation

Controlled unit: `SHILOH-CLEAN-CRM-V2-PRODUCTION-FOUNDATION-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **DURABLE PRODUCTION STATE RECONCILED**

## Authoritative outcome

The Clean CRM V2 **physical production foundation is live and empty**.

Production migration sequence #523 → #525 → #522 completed safely and is terminal. The migration ledger is fully reconciled:

- deployed migration files: **88**;
- `schema_migrations`: **88**;
- pending migrations: **0**;
- checksum mismatches: **0**;
- no ledger row absent from the deployed release.

CRM V2 physical schema state:

- `crm_v2_clients` exists;
- row count at foundation release: **0**;
- `appointments.crm_v2_client_id` exists as nullable `bigint`;
- appointments linked to CRM V2 at foundation release: **0**;
- required V2 indexes and appointment foreign key are present;
- the appointment foreign key uses `ON DELETE SET NULL`.

No legacy client, contact, alias, Goldie, appointment or identity evidence was imported/backfilled into CRM V2.

## Production proof boundary

Accepted #522 terminal proof preserved the captured legacy business counts and appointment #592 exactly. Production remained healthy with HTTP 200 / `database: ok`.

Immediately after #522, 00 independently reconciled:

- GitHub `main`: `d7b132adc327abd56afa5f08f62a8e1734abc4f2`;
- tree: `da4459600247dd5174f0f3e3647cbe7109f7ade7`;
- Render deploy: `dep-da8ac2ek1f9s73f5o9eg`;
- deployed SHA: `d7b132adc327abd56afa5f08f62a8e1734abc4f2`;
- deploy status: live.

No code deployment was required to apply migration 084; it was applied as a bounded exact-target production database operation against the already-deployed release.

## CRM V2 architecture now authoritative

`crm_v2_clients` is the clean future operational client master.

`src/services/crmV2ClientService.js` remains the canonical V2 client-resolution boundary for future Calendar and WhatsApp integrations.

Durable identity rules:

- exact normalized South African mobile is the only automatic client-resolution key;
- name is display/operator search data, not automatic identity authority;
- no fuzzy/name/alias/Goldie/legacy auto-merge into CRM V2;
- staff may create a minimal V2 client through the canonical service;
- verified inbound WhatsApp sender interaction may later complete/register the same exact-mobile V2 client;
- no permanent dual-master or dual-resolution architecture is intended.

## Calendar transition boundary

Calendar integration is **not yet live** at this checkpoint.

Issue #526 (`SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0`) is the next active controlled unit.

The authoritative transition contract is:

- new V2 bookings resolve/create clients through the CRM V2 service;
- new V2 appointments write `appointments.crm_v2_client_id`;
- new V2 appointments leave legacy `appointments.client_id` null;
- existing appointments remain operable through their existing legacy `client_id` and stored snapshots;
- no historical appointment backfill;
- no legacy client import/backfill;
- Calendar owns deliberate final-mobile acknowledgement before confirmation messaging;
- the V2 path must not reuse or extend the superseded legacy identity-evidence state machinery.

This transition seam is deliberately one-way for new operational activity and avoids manufacturing shadow legacy clients.

## WhatsApp transition boundary

WhatsApp ↔ CRM V2 registration cutover is **not yet authorized or live**.

It remains a separate later 30-owned controlled unit after Calendar V2 cutover is proven. The future WhatsApp path must use the verified inbound sender mobile directly and must not consult Goldie, aliases, `user_profiles` or legacy identity evidence for normal V2 resolution.

## Legacy CRM / identity state

Legacy CRM and identity components remain physically present and transitional because existing appointments and current runtime paths still depend on them.

Do not delete, reset, bulk-migrate or mass-clean legacy CRM/identity data during the Calendar or WhatsApp cutovers.

Only after both new operational paths are proven should 00 evaluate which legacy runtime dependencies can be retired. Physical retained-data deletion remains separately gated by restore/destructive-authority rules.

## Calendar / Google scheduling state

Shiloh Calendar is the normal scheduling authority. The engineering/runtime tranche for issue #512 is complete through merged PR #513 and is frozen.

Google Calendar is no longer required as a normal scheduling/availability authority or mirror for new Shiloh operation. Existing Google events were deliberately left untouched.

Physical Google provider/environment disconnection has **not** been performed. It is not an active P0 and is not required for CRM V2 work. If later chosen, destructive provider retirement requires a fresh 40-controlled unit and explicit JP authorization.

## Product simplification

The standalone #524 label unit is superseded by #526.

The durable product decision is:

`Find client | New client`

Client creation remains contextual inside Create Booking; there is no separate top-level `Client registration` action.

## Current operational spine

`Shiloh Calendar → Clean CRM V2 → WhatsApp communications / client registration`

Next active unit: **#526 — Calendar Clean CRM V2 cutover for new bookings.**

No Calendar/WhatsApp V2 integration, legacy retirement or provider retirement may be inferred complete from the physical foundation milestone alone.
