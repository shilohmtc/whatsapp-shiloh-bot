# Shiloh OS Project Tracker Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp CRM V2 Transition

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **RECONCILED — CORE WHATSAPP SPINE P0 ROUTED**

## Terminal CRM V2 production sequence

| Issue | Controlled unit | Owner | Terminal state | Do not redo |
|---|---|---|---|---|
| #526 | `SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0` | 10 — Calendar & Booking Assurance | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #529 | `SHILOH-CALENDAR-CRM-V2-MIGRATION-085-P0` | 40 — Production & DevOps | PASS / CLOSED / 89 OF 89 | Yes |
| #531 | `SHILOH-WHATSAPP-CRM-V2-IDENTITY-COMPAT-FOUNDATION-P0` | 20 — CRM & Identity | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #534 | `SHILOH-WHATSAPP-CRM-V2-IDENTITY-MIGRATION-086-P0` | 40 — Production & DevOps | PASS / CLOSED / 90 OF 90 | Yes |

PR #528 and PR #533 are merged and deployed.

Authoritative production release at this reconciliation:

- `main`: `692b836e9b5c486e18458dc70a4880de031dc556`;
- tree: `f455b158fbd6a568573bbfce01e5199230f5b94a`;
- Render deploy: `dep-da8n6ibrjlhs73d70fbg`;
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

Issue #531 and release gate #534 are complete.

Production now includes contract `whatsapp_crm_identity_compat_v1` and can durably represent exactly one of:

- retained legacy client identity; or
- canonical CRM V2 client identity.

Migration 086 is deployed exactly once with checksum:

`393e6ee02f911b01cd4f96c167c1c324e1c7ae02154e6b4d8009e0ebdd5a9899`

Durable onboarding now has nullable `crm_v2_client_id`, `identity_model`, mutually exclusive identity constraints, a CRM V2 FK with `ON DELETE RESTRICT`, and the partial V2 index. No retained-row backfill or conversion was performed.

The single pre-release onboarding row was removed by the pre-existing two-hour temporary-registration expiry mechanism during normal startup maintenance. It was not migration 086 DML/backfill/conversion.

The identity layer now provides:

- explicit `legacy` / `crm_v2` discrimination;
- canonical exact-mobile CRM V2 resolution through `crmV2ClientService`;
- deterministic restart/resume/stale-authority handling;
- model-aware provenance;
- fail-closed dual-master protection.

## Activation remains intentionally frozen

New WhatsApp client onboarding still creates retained legacy clients.

`crmV2ClientService.registerWhatsAppClient()` remains inactive in production onboarding.

Ordinary WhatsApp booking, practitioner approval and appointment management have not yet been cut over to CRM V2 identity. Couples Massage, package and enquiry paths also remain outside the CRM V2 activation boundary.

A shadow legacy client is not an acceptable compatibility strategy.

## Current active P0

Issue #535 — `SHILOH-WHATSAPP-CRM-V2-CORE-BOOKING-SPINE-COMPAT-P0`

Owner: **30 — WhatsApp & Meta Integration**

State: **ACTIVE / ENGINEERING ROUTED**

Objective:

Make the ordinary single-client WhatsApp booking spine carry either retained legacy identity or canonical CRM V2 identity end-to-end without activating new CRM V2 registration.

Required core proof includes:

- discriminated identity continuity through booking state;
- final legacy/V2 appointment commit using exactly one client master;
- canonical server-derived CRM V2 name/mobile snapshots;
- stale/missing/ambiguous CRM V2 authority failing closed before commit;
- practitioner-approval continuity where required;
- ordinary appointment-management identity continuity;
- booking-confirmation/lifecycle compatibility;
- no shadow legacy client/contact creation;
- legacy behavior preserved;
- Couples/packages/enquiries kept explicitly outside scope or fail closed for CRM V2 identity.

## Sequencing

1. **#535 — 30 / WhatsApp & Meta Integration:** make the ordinary booking/approval/appointment-management spine CRM V2 identity-compatible, without registration activation.
2. **30 / 00:** only after #535 is proven and released, evaluate activation of CRM V2 registration for new WhatsApp clients.
3. Handle Couples Massage, packages, enquiries and other retained legacy-ID-specific capabilities deliberately in bounded units or explicit fail-closed compatibility; no silent shadow-client creation.
4. Only after Calendar and WhatsApp new operational paths are proven should 00 evaluate retirement of superseded legacy CRM/identity dependencies.

No unrelated P0/P1 work should interrupt this spine unless it removes a blocker, reduces a real dependency, or remediates a genuine production/security risk.
