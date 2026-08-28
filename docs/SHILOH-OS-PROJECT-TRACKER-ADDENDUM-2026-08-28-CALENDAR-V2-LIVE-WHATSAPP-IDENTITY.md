# Shiloh OS Project Tracker Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp CRM V2 Transition

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **RECONCILED — RESCHEDULE COMPATIBILITY P0 ROUTED**

## Terminal CRM V2 production sequence

| Issue | Controlled unit | Owner | Terminal state | Do not redo |
|---|---|---|---|---|
| #526 | `SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0` | 10 — Calendar & Booking Assurance | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #529 | `SHILOH-CALENDAR-CRM-V2-MIGRATION-085-P0` | 40 — Production & DevOps | PASS / CLOSED / 89 OF 89 | Yes |
| #531 | `SHILOH-WHATSAPP-CRM-V2-IDENTITY-COMPAT-FOUNDATION-P0` | 20 — CRM & Identity | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #534 | `SHILOH-WHATSAPP-CRM-V2-IDENTITY-MIGRATION-086-P0` | 40 — Production & DevOps | PASS / CLOSED / 90 OF 90 | Yes |
| #535 | `SHILOH-WHATSAPP-CRM-V2-CORE-BOOKING-SPINE-COMPAT-P0` | 30 — WhatsApp & Meta Integration | PASS / CLOSED / PRODUCTION LIVE | Yes |

PR #528, PR #533 and PR #537 are merged and deployed.

Authoritative production release at this reconciliation:

- `main`: `cffa7c662f50e518a9a0fffad3ada08d05e4c412`;
- tree: `b4a90f5f8e3f9534eee231d0908a87bdf4f30151`;
- Render deploy: `dep-da8o5mf10e5c73c23ik0`;
- migration files: **90**;
- `schema_migrations`: **90**;
- pending migrations: **0**;
- checksum mismatches: **0**.

## Calendar CRM V2 production contract

For new Calendar bookings:

- CRM V2 is the canonical client-resolution boundary;
- exact normalized South African mobile is the sole automatic identity key;
- new V2 appointments write `crm_v2_client_id`;
- new V2 appointments leave legacy `client_id` null;
- no shadow legacy client/contact dual-write is created;
- retained legacy appointments remain legacy-readable and were not backfilled;
- server-authoritative mobile acknowledgement, final CRM V2 reread and confirmation guarantees are preserved.

Migration 085 physical state remains exact. Its original physical-DDL transaction is catalog transaction `73856`; its execution source remains materially unexplained and must not be rewritten as known history. The reconciled ledger `applied_at` is ledger-reconciliation time, not the original DDL execution time.

## WhatsApp CRM V2 identity foundation — terminal

Issues #531 and #534 are complete.

Production includes contract `whatsapp_crm_identity_compat_v1` and can durably represent exactly one retained legacy client identity or one canonical CRM V2 client identity.

Migration 086 is deployed exactly once with checksum:

`393e6ee02f911b01cd4f96c167c1c324e1c7ae02154e6b4d8009e0ebdd5a9899`

The identity layer provides:

- explicit `legacy` / `crm_v2` discrimination;
- canonical exact-mobile CRM V2 resolution through `crmV2ClientService`;
- deterministic restart/resume/stale-authority handling;
- model-aware provenance;
- fail-closed dual-master protection;
- no retained-row backfill or conversion.

## Core WhatsApp booking spine — terminal

Issue #535 is complete and production-live.

The ordinary single-client WhatsApp booking path can now carry either retained legacy identity or canonical CRM V2 identity without creating a shadow legacy client.

For final appointment commit:

- legacy → `appointments.client_id` populated and `appointments.crm_v2_client_id` null;
- CRM V2 → `appointments.client_id` null and canonical `appointments.crm_v2_client_id` populated.

CRM V2 final booking authority is revalidated under the final transaction/locking boundary from exact normalized mobile, and client-facing name/mobile snapshots are server-derived from canonical CRM V2 authority.

The production-live compatibility path also covers ordinary practitioner approval, cancellation, reminder confirmation, customer appointment actions, change notifications and existing booking-confirmation/lifecycle CRM V2 snapshots.

Legacy bookings and retained legacy appointments remain compatible with no backfill.

## Activation remains intentionally frozen

New WhatsApp client onboarding still creates retained legacy clients.

`crmV2ClientService.registerWhatsAppClient()` remains inactive in production onboarding.

Registration activation is still prohibited because practitioner-approved reschedule requests remain legacy-ID-only.

Current authoritative reschedule schema includes:

`appointment_reschedule_requests.client_id BIGINT NOT NULL REFERENCES clients(id)`.

CRM V2 rescheduling therefore remains explicit fail-closed behavior in production. Couples Massage, packages and enquiries also remain explicit legacy-specific/fail-closed CRM V2 boundaries, but they are special capabilities and do not need to block the ordinary client-authority transition once core lifecycle behavior is complete.

## Current active P0

Issue #538 — `SHILOH-WHATSAPP-CRM-V2-RESCHEDULE-COMPAT-P0`

Owner: **30 — WhatsApp & Meta Integration**

State: **ACTIVE / ENGINEERING ROUTED**

Objective:

Make the practitioner-approved WhatsApp reschedule workflow carry exactly one retained legacy or canonical CRM V2 identity without changing approval semantics and without activating new CRM V2 registration.

Expected bounded architecture:

- additive backward-compatible request identity expansion if required;
- legacy `client_id` retained but made compatible with V2 XOR authority;
- nullable `crm_v2_client_id` FK to `crm_v2_clients(id)` with `ON DELETE RESTRICT` where required;
- no retained-row backfill/conversion;
- canonical exact-mobile V2 revalidation before request creation and relevant mutation boundaries;
- approved reschedule preserves the appointment's existing client identity model;
- V2 customer notification authority is server-derived;
- pending-hold, conflict, first-decision-wins and retry/idempotency semantics preserved;
- no shadow legacy client/contact creation;
- CRM V2 registration remains inactive.

## Sequencing

1. **#538 — 30 / WhatsApp & Meta Integration:** make practitioner-approved rescheduling CRM V2 identity-compatible, without registration activation.
2. **30 / 00:** after #538 is proven and released, route a separate bounded activation unit for new WhatsApp CRM V2 registration.
3. Handle Couples Massage, packages, enquiries and other retained legacy-ID-specific capabilities deliberately in follow-on bounded units; explicit fail-closed behavior is acceptable until then and no silent shadow-client creation is allowed.
4. Only after Calendar and WhatsApp new operational paths are proven should 00 evaluate retirement of superseded legacy CRM/identity dependencies.

No unrelated P0/P1 work should interrupt this spine unless it removes a blocker, reduces a real dependency, or remediates a genuine production/security risk.
