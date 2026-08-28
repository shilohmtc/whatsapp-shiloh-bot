# Shiloh OS Master Status Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp CRM V2 Transition

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **DURABLE PRODUCTION STATE RECONCILED — CALENDAR AND NEW WHATSAPP REGISTRATION LIVE ON CLEAN CRM V2**

## Authoritative production state

Clean CRM V2 is live as the client authority for:

- **new Shiloh Calendar bookings**; and
- **new/unbound WhatsApp client registration**.

The WhatsApp runtime also has a production-live dual-model compatibility spine so retained legacy clients remain supported while new CRM V2 clients can use the ordinary booking lifecycle without a shadow legacy master.

Authoritative release at reconciliation:

- `main`: `67069fbe0b650e807060d23eda135d9772a79e20`;
- tree: `45a421937ab929a4dab7ee07ac087074b37d628f`;
- Render deploy: `dep-da8q5sek1f9s73ce1l10` — **LIVE**;
- migration inventory / ledger: **91 / 91**;
- pending migrations: **0**;
- checksum mismatches: **0**.

Issues #526, #529, #531, #534, #535, #538, #541 and #542 are terminal PASS / CLOSED / DO NOT REDO.

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

The original execution source of that physical DDL remains materially unexplained. 00 did not waive or rewrite that fact. The exact migration file was reconciled to deployed inventory and ledger without re-running the already-correct DDL, and later Calendar/WhatsApp releases continue to checksum-verify the reconciled migration inventory.

The migration ledger `applied_at` for 085 records ledger-reconciliation time and must not be interpreted as the unknown original physical-DDL execution time.

## WhatsApp CRM V2 identity substrate

Production includes identity contract:

`whatsapp_crm_identity_compat_v1`

The runtime can represent exactly one of:

- `legacy` → retained `clients.id`; or
- `crm_v2` → canonical `crm_v2_clients.id`.

Durable onboarding state includes nullable `crm_v2_client_id` plus `identity_model`, guarded by mutually exclusive identity integrity rules. Canonical V2 matching remains exact-mobile only through `crmV2ClientService`.

Migration 086 is production-live exactly once with checksum:

`393e6ee02f911b01cd4f96c167c1c324e1c7ae02154e6b4d8009e0ebdd5a9899`

It performed no retained-row backfill or conversion.

## Core WhatsApp ordinary lifecycle — production live

The ordinary single-client WhatsApp path now carries either retained legacy identity or canonical CRM V2 identity through:

- booking identity handoff;
- final appointment commit;
- practitioner approval where required;
- booking confirmation/lifecycle recipient snapshots;
- appointment lookup and cancellation;
- reminder confirmation;
- customer appointment actions;
- change notifications; and
- practitioner-approved rescheduling.

Final appointment identity authority is:

- legacy booking → `appointments.client_id` populated, `appointments.crm_v2_client_id` null;
- CRM V2 booking → `appointments.client_id` null, canonical `appointments.crm_v2_client_id` populated.

CRM V2 final booking and reschedule authority is revalidated from exact normalized mobile under the relevant transaction/locking boundary. Client-facing name/mobile authority is server-derived from canonical CRM V2 state rather than trusted carried snapshots.

Migration 087 is production-live exactly once with checksum:

`604fa879a6ef1afd8851a883afb45e2ebe63c42a11ff23bf27a82825eb11de78`

Its production schema makes retained reschedule `client_id` nullable, adds nullable `crm_v2_client_id` with `ON DELETE RESTRICT`, and enforces exactly one request identity master. No retained-row backfill or conversion occurred.

## New WhatsApp registration — production live on Clean CRM V2

Issue #542 and PR #543 activated the new-registration cutover.

For **new/unbound WhatsApp registration**:

- `crmV2ClientService.registerWhatsAppClient()` is the sole canonical registration write boundary;
- inbound WhatsApp sender mobile is normalized through the canonical South African mobile rules;
- exact-mobile lock/resolve/create/update semantics remain owned by the CRM V2 service;
- an existing exact-mobile CRM V2 owner is completed/updated in place rather than duplicated;
- ambiguous, stale, missing or different-owner CRM V2 authority fails closed;
- durable onboarding ends with `client_id = NULL`, canonical `crm_v2_client_id`, and `identity_model = 'crm_v2'`;
- booking continuation is exposed only after durable persistence and exact-mobile revalidation succeed;
- the old unbound `INSERT INTO clients ... source='whatsapp_onboarding'` path is retired;
- no new legacy `client_contacts` row is created solely to support new WhatsApp onboarding.

Production startup on the activation release reports:

- `crmV2RegistrationActive: true`;
- `registrationBoundary: crmV2ClientService.registerWhatsAppClient`;
- migration 086 checksum verification successful;
- migration 087 checksum/schema verification successful with no rerun;
- `Shiloh started`.

No synthetic production client, appointment or message was created for release proof. From this activation onward, legitimate real new WhatsApp registrations may create canonical CRM V2 clients through normal product behavior.

## Retained legacy compatibility

This cutover is not a historical migration.

Retained verified legacy clients remain legacy. Existing legacy appointments, identity evidence, imported-client repair rules and normal retained relationships remain supported without bulk import, backfill or forced conversion.

There is no permanent legacy/V2 dual master for a new CRM V2 client.

## Explicit special-capability boundaries

Couples Massage, package entitlement/booking and enquiry/lead paths still contain retained legacy-ID-specific assumptions.

For CRM V2 identities those branches remain explicit fail-closed boundaries until a separately justified bounded migration is undertaken.

Do **not** manufacture a shadow legacy client/contact merely to make those special capabilities work.

These special branches are not an active P0 by default. Under the Shiloh OS product test they should only be migrated when operational necessity and business value justify their lifetime complexity.

## Durable transition state

Completed:

1. Calendar Clean CRM V2 cutover (#526/#529) — **COMPLETE / LIVE**.
2. WhatsApp CRM V2 identity substrate (#531/#534) — **COMPLETE / LIVE**.
3. Core ordinary WhatsApp booking lifecycle compatibility (#535) — **COMPLETE / LIVE**.
4. Practitioner-approved reschedule compatibility and migration 087 (#538/#541) — **COMPLETE / LIVE**.
5. New WhatsApp registration activation (#542) — **COMPLETE / LIVE**.

No additional CRM V2 cutover P0 is required at this terminal state.

The preferred next posture is **stabilize and observe**, not adjacent feature growth. Any later Couples/packages/enquiries conversion or legacy CRM retirement should be opened only as a separately justified controlled unit.

## Legacy and provider boundaries

Legacy CRM/identity data remains physically present and authoritative for retained legacy relationships until separately retired. Do not bulk-import, reset or delete retained legacy data merely because new Calendar/WhatsApp operational paths now use CRM V2.

Physical Google provider/environment disconnection remains a separate owner-level retirement decision and is not a prerequisite for CRM V2 operation.

## Current operational spine

`Shiloh Calendar new bookings → Clean CRM V2`

`New WhatsApp registration → Clean CRM V2`

`WhatsApp retained legacy clients → retained legacy authority`

`WhatsApp identity substrate → legacy / CRM V2 compatible`

`WhatsApp ordinary booking/approval/appointment-management/reschedule → legacy / CRM V2 compatible`

`Couples Massage / packages / enquiries → explicit CRM V2 fail-closed special-case boundaries pending separate justification`

Current priority:

`Stabilization / production observation — no further CRM V2 cutover P0 active`
