# Shiloh OS Master Status Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp Identity Transition

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **DURABLE PRODUCTION STATE RECONCILED**

## Authoritative production state

Clean CRM V2 is now live as the client authority for **new Shiloh Calendar bookings**.

Authoritative release at reconciliation:

- `main`: `c0acdc42b6603e40f082dfe61aceec38d2fe7972`;
- tree: `5b3d02b9ff036d08641d07ffda3b0f6d607354b3`;
- Render deploy: `dep-da8lf33tqb8s73d2sikg`;
- migration inventory / ledger: **89 / 89**;
- pending migrations: **0**;
- checksum mismatches: **0**.

Issues #526 and #529 are terminal PASS / CLOSED / DO NOT REDO.

## Calendar CRM V2 authority

For new Calendar bookings:

- `src/services/crmV2ClientService.js` is the canonical V2 client boundary;
- exact normalized South African mobile is the sole automatic identity key;
- new V2 appointments use `appointments.crm_v2_client_id`;
- legacy `appointments.client_id` is null on the V2 path;
- no shadow legacy client/contact dual-write is part of the V2 path;
- historical appointments remain on their retained legacy relationships and were not backfilled;
- final mobile acknowledgement and confirmation-delivery guarantees remain server-authoritative.

The production cutover did not create or backfill CRM V2 clients merely for deployment proof.

## Migration 085 provenance record

The physical migration-085 schema is exact and remains catalog-attributed to transaction `73856`.

The original execution source of that physical DDL remains materially unexplained. 00 deliberately did not waive or rewrite that fact. Instead, the exact migration file was placed into the authoritative deployed inventory, the already-correct schema was reconciled to the migration ledger without DDL, and the final Calendar deployment verified migration 085 as checksum/no-op startup handling.

The migration ledger `applied_at` for 085 records the later ledger-reconciliation time; it must not be interpreted as the unknown original physical-DDL execution time.

## WhatsApp transition state

WhatsApp new-client onboarding is **not yet cut over to CRM V2**.

Current production onboarding still creates a legacy client and related legacy identity records. Returning-client resolution, ordinary WhatsApp booking, practitioner approval, appointment management, Couples Massage, package/enquiry flows, transition welcome and operational provenance still contain legacy `client_id` assumptions.

`crmV2ClientService.registerWhatsAppClient()` exists and is tested at the service layer, but production WhatsApp runtime does not invoke it.

Therefore a registration-only activation is not safe: a newly created V2 client would not have a complete downstream WhatsApp operating path. A shadow legacy client is not an acceptable compatibility strategy because it would reintroduce dual-master authority.

## Active identity transition

Issue #531 (`SHILOH-WHATSAPP-CRM-V2-IDENTITY-COMPAT-FOUNDATION-P0`) is the active P0.

Owner: **20 — CRM & Identity**.

Its purpose is to establish a discriminated WhatsApp identity model that can represent exactly one of:

- retained legacy client identity for existing compatibility; or
- canonical CRM V2 identity for new operational activity.

Phase A is non-activating. It must preserve legacy behavior, exact-mobile V2 identity semantics, restart/resume/stale-authority determinism, and audit provenance while creating no shadow client master.

## Transition sequence

The durable transition sequence is:

1. CRM & Identity compatibility foundation (#531), without V2 registration activation.
2. Make the core WhatsApp booking, practitioner approval, notification and appointment-management spine V2-aware.
3. Activate new WhatsApp CRM V2 registration only after the core spine is compatible.
4. Handle Couples Massage, packages and other legacy-ID-specific capabilities deliberately rather than silently dual-writing legacy clients.
5. Evaluate legacy CRM/identity retirement only after both Calendar and WhatsApp new operational paths are proven.

## Legacy and provider boundaries

Legacy CRM/identity data remains physically present and authoritative for retained legacy relationships until separately retired. Do not bulk-import, backfill, reset or delete retained legacy data as part of the transition.

Physical Google provider/environment disconnection remains a separate owner-level retirement decision and is not a prerequisite for CRM V2 work.

## Current operational spine

Current:

`Shiloh Calendar new bookings → Clean CRM V2`

`WhatsApp new-client onboarding → legacy CRM (transitional)`

Next active unit:

`#531 — WhatsApp CRM V2 identity compatibility foundation`
