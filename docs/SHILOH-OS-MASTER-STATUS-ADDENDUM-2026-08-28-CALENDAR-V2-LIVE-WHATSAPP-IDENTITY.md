# Shiloh OS Master Status Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp CRM V2 Transition

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **DURABLE PRODUCTION STATE RECONCILED**

## Authoritative production state

Clean CRM V2 is live as the client authority for **new Shiloh Calendar bookings**.

The WhatsApp runtime now also has a production-live dual-model identity compatibility substrate, but **new WhatsApp CRM V2 registration is not yet active**.

Authoritative release at reconciliation:

- `main`: `692b836e9b5c486e18458dc70a4880de031dc556`;
- tree: `f455b158fbd6a568573bbfce01e5199230f5b94a`;
- Render deploy: `dep-da8n6ibrjlhs73d70fbg`;
- migration inventory / ledger: **90 / 90**;
- pending migrations: **0**;
- checksum mismatches: **0**.

Issues #526, #529, #531 and #534 are terminal PASS / CLOSED / DO NOT REDO.

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

## WhatsApp CRM V2 identity authority now live

Production now includes identity contract:

`whatsapp_crm_identity_compat_v1`

The runtime can represent exactly one of:

- `legacy` → retained `clients.id`; or
- `crm_v2` → canonical `crm_v2_clients.id`.

Durable onboarding state includes nullable `crm_v2_client_id` plus `identity_model`, guarded by mutually exclusive identity integrity rules. The CRM V2 foreign key uses `ON DELETE RESTRICT`.

Canonical CRM V2 matching remains exact-mobile only through `crmV2ClientService`; name, DOB, similarity and legacy evidence do not gain automatic V2 identity authority.

Restart/resume/stale-authority handling is deterministic and fails closed when canonical ownership is missing, ambiguous or changed.

Migration 086 is production-live exactly once with checksum:

`393e6ee02f911b01cd4f96c167c1c324e1c7ae02154e6b4d8009e0ebdd5a9899`

It performed no retained-row backfill or conversion. The one retained onboarding session present during preflight was subsequently removed by the pre-existing two-hour temporary-registration cleanup and is classified as adjacent normal runtime maintenance, not migration behavior.

## WhatsApp activation boundary

WhatsApp new-client onboarding is **still legacy CRM**.

`crmV2ClientService.registerWhatsAppClient()` exists and remains inactive in the production onboarding path.

Ordinary WhatsApp booking, practitioner approval and appointment management have not yet been made fully CRM V2 identity-compatible. Couples Massage, packages and enquiries also retain legacy-ID-specific assumptions.

Therefore activation of new WhatsApp CRM V2 registration remains prohibited until the ordinary operational spine can consume the dual-model identity safely.

Creating a shadow legacy client for a CRM V2 identity remains prohibited because it would recreate dual-master authority.

## Active transition unit

Issue #535 (`SHILOH-WHATSAPP-CRM-V2-CORE-BOOKING-SPINE-COMPAT-P0`) is the active P0.

Owner: **30 — WhatsApp & Meta Integration**.

Its purpose is to make the ordinary single-client WhatsApp booking/approval/appointment-management spine accept the production-live discriminated identity contract without activating CRM V2 registration.

The target contract is:

- legacy booking → `appointments.client_id` populated and `appointments.crm_v2_client_id` null;
- CRM V2 booking → `appointments.client_id` null and canonical `appointments.crm_v2_client_id` populated;
- CRM V2 client-facing name/mobile snapshots server-derived at final authority time;
- stale/missing/ambiguous CRM V2 authority fails closed before commit;
- no shadow legacy client/contact write;
- retained legacy paths remain compatible.

Couples Massage, packages, enquiries and other retained legacy-ID-specific capabilities are not to be silently broadened into this unit; they must remain explicitly bounded or fail closed for CRM V2 identity until separately handled.

## Durable transition sequence

1. CRM & Identity compatibility foundation (#531/#534) — **COMPLETE / LIVE**.
2. Core ordinary WhatsApp booking/approval/appointment-management compatibility (#535) — **ACTIVE**.
3. Activate new WhatsApp CRM V2 registration only after #535 is proven/released and 00 separately authorizes activation.
4. Handle Couples Massage, packages, enquiries and other legacy-ID-specific capabilities deliberately rather than silently dual-writing legacy clients.
5. Evaluate legacy CRM/identity retirement only after both Calendar and WhatsApp new operational paths are proven.

## Legacy and provider boundaries

Legacy CRM/identity data remains physically present and authoritative for retained legacy relationships until separately retired. Do not bulk-import, backfill, reset or delete retained legacy data as part of this transition.

Physical Google provider/environment disconnection remains a separate owner-level retirement decision and is not a prerequisite for CRM V2 work.

## Current operational spine

Current:

`Shiloh Calendar new bookings → Clean CRM V2`

`WhatsApp identity substrate → legacy / CRM V2 compatible`

`WhatsApp new-client onboarding → legacy CRM (transitional)`

`WhatsApp ordinary booking spine → legacy identity authority pending #535 compatibility`

Next active unit:

`#535 — Core WhatsApp booking spine CRM V2 identity compatibility`
