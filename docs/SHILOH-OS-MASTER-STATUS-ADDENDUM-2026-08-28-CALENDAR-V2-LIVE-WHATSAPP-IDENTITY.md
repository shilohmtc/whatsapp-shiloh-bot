# Shiloh OS Master Status Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp CRM V2 Transition

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **DURABLE PRODUCTION STATE RECONCILED**

## Authoritative production state

Clean CRM V2 is live as the client authority for **new Shiloh Calendar bookings**.

The WhatsApp runtime now has both:

- a production-live dual-model client identity substrate; and
- a production-live ordinary booking/approval/appointment-management compatibility spine for retained legacy or CRM V2 identity.

**New WhatsApp CRM V2 registration is not yet active.**

Authoritative release at reconciliation:

- `main`: `cffa7c662f50e518a9a0fffad3ada08d05e4c412`;
- tree: `b4a90f5f8e3f9534eee231d0908a87bdf4f30151`;
- Render deploy: `dep-da8o5mf10e5c73c23ik0`;
- migration inventory / ledger: **90 / 90**;
- pending migrations: **0**;
- checksum mismatches: **0**.

Issues #526, #529, #531, #534 and #535 are terminal PASS / CLOSED / DO NOT REDO.

## Calendar CRM V2 authority

For new Calendar bookings:

- `src/services/crmV2ClientService.js` is the canonical V2 client boundary;
- exact normalized South African mobile is the sole automatic identity key;
- new V2 appointments use `appointments.crm_v2_client_id`;
- legacy `appointments.client_id` is null on the V2 path;
- no shadow legacy client/contact dual-write is part of the V2 path;
- historical appointments remain on retained legacy relationships and were not backfilled;
- final mobile acknowledgement and confirmation-delivery guarantees remain server-authoritative.

## Migration 085 provenance record

The physical migration-085 schema remains exact and catalog-attributed to transaction `73856`.

The original execution source of that physical DDL remains materially unexplained. 00 did not waive or rewrite that fact. The exact migration file was reconciled to deployed inventory and ledger without re-running the already-correct DDL, and the final Calendar deployment verified migration 085 as checksum/no-op startup handling.

The migration ledger `applied_at` for 085 records ledger-reconciliation time and must not be interpreted as the unknown original physical-DDL execution time.

## WhatsApp CRM V2 identity authority

Production includes identity contract:

`whatsapp_crm_identity_compat_v1`

The runtime can represent exactly one of:

- `legacy` → retained `clients.id`; or
- `crm_v2` → canonical `crm_v2_clients.id`.

Durable onboarding state includes nullable `crm_v2_client_id` plus `identity_model`, guarded by mutually exclusive identity integrity rules. Canonical V2 matching remains exact-mobile only through `crmV2ClientService`.

Migration 086 is production-live exactly once with checksum:

`393e6ee02f911b01cd4f96c167c1c324e1c7ae02154e6b4d8009e0ebdd5a9899`

It performed no retained-row backfill or conversion.

## Core WhatsApp booking spine authority now live

Issue #535 is production-live.

The ordinary single-client WhatsApp booking path now consumes the discriminated identity contract rather than treating every client identifier as a legacy `clients.id`.

Final appointment identity authority is:

- legacy booking → `appointments.client_id` populated, `appointments.crm_v2_client_id` null;
- CRM V2 booking → `appointments.client_id` null, canonical `appointments.crm_v2_client_id` populated.

For CRM V2 final booking commit, exact normalized mobile ownership is revalidated/locked through canonical CRM V2 semantics before appointment insertion. Client-facing name/mobile authority is server-derived from the canonical CRM V2 record.

The compatibility release also preserves identity through ordinary practitioner approval and supports CRM V2 identity for ordinary appointment cancellation, reminder confirmation, customer actions, change notifications and the existing booking-confirmation/lifecycle snapshot seams.

Retained legacy booking behavior remains compatible and no historical appointment/client backfill occurred.

No shadow `clients` or `client_contacts` record is manufactured for a CRM V2 identity.

## WhatsApp activation boundary

WhatsApp new-client onboarding remains **legacy CRM**.

`crmV2ClientService.registerWhatsAppClient()` exists and remains inactive in the production onboarding path.

The last identified ordinary appointment-lifecycle blocker before registration activation is practitioner-approved rescheduling.

Current authoritative reschedule request schema retains:

`appointment_reschedule_requests.client_id BIGINT NOT NULL REFERENCES clients(id)`.

The request creation/authority path also remains based on legacy `clients` / `client_contacts`. Consequently CRM V2 rescheduling currently fails closed rather than creating compatibility data.

This is preferable to a shadow legacy client, but it is not the desired end-state for ordinary client lifecycle operations.

Couples Massage, packages and enquiries also remain retained legacy-ID-specific/fail-closed for CRM V2 identity. These are special capabilities and can be migrated deliberately after the ordinary new-client spine is complete.

## Active transition unit

Issue #538 (`SHILOH-WHATSAPP-CRM-V2-RESCHEDULE-COMPAT-P0`) is the active P0.

Owner: **30 — WhatsApp & Meta Integration**.

Its purpose is to make the existing practitioner-approved reschedule workflow accept exactly one retained legacy identity or canonical CRM V2 identity without changing approval semantics and without activating CRM V2 registration.

The target contract is:

- legacy reschedule request → retained `client_id`, V2 ID null;
- CRM V2 reschedule request → `client_id` null, canonical V2 ID populated;
- no retained-row backfill/conversion;
- canonical exact-mobile V2 authority revalidated before request creation and relevant mutation boundaries;
- approval/decline preserves the request and appointment client identity model;
- approved reschedule never converts between legacy and V2 identity;
- V2 notification name/mobile authority remains server-derived;
- pending-hold, conflict, first-decision-wins, retry and idempotency semantics remain intact;
- no shadow legacy client/contact write.

## Durable transition sequence

1. CRM & Identity compatibility foundation (#531/#534) — **COMPLETE / LIVE**.
2. Core ordinary WhatsApp booking/approval/appointment-management compatibility (#535) — **COMPLETE / LIVE**.
3. Practitioner-approved reschedule compatibility (#538) — **ACTIVE**.
4. After #538 is proven/released, route a separate explicit activation unit for new WhatsApp CRM V2 registration.
5. Handle Couples Massage, packages, enquiries and other retained legacy-ID-specific capabilities deliberately in bounded follow-on units; explicit fail-closed behavior is acceptable until separately migrated.
6. Evaluate legacy CRM/identity retirement only after Calendar and WhatsApp new operational paths are proven and retained dependencies no longer earn their complexity.

## Legacy and provider boundaries

Legacy CRM/identity data remains physically present and authoritative for retained legacy relationships until separately retired. Do not bulk-import, backfill, reset or delete retained legacy data as part of this transition.

Physical Google provider/environment disconnection remains a separate owner-level retirement decision and is not a prerequisite for CRM V2 work.

## Current operational spine

Current:

`Shiloh Calendar new bookings → Clean CRM V2`

`WhatsApp identity substrate → legacy / CRM V2 compatible`

`WhatsApp ordinary booking spine → legacy / CRM V2 compatible`

`WhatsApp practitioner-approved reschedule → legacy only / CRM V2 fail closed pending #538`

`WhatsApp new-client onboarding → legacy CRM (transitional)`

Next active unit:

`#538 — WhatsApp CRM V2 reschedule approval compatibility`
