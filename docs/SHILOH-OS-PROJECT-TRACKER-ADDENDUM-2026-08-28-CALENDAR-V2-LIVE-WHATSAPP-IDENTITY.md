# Shiloh OS Project Tracker Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp Identity Foundation

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **RECONCILED — NEXT P0 ROUTED**

## Terminal Calendar / migration sequence

The Clean CRM V2 Calendar cutover is production-live and terminal.

| Issue | Controlled unit | Owner | Terminal state | Do not redo |
|---|---|---|---|---|
| #526 | `SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0` | 10 — Calendar & Booking Assurance | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #529 | `SHILOH-CALENDAR-CRM-V2-MIGRATION-085-P0` | 40 — Production & DevOps | PASS / CLOSED / 89 OF 89 | Yes |

PR #528 is merged and deployed.

Authoritative production release at reconciliation:

- `main`: `c0acdc42b6603e40f082dfe61aceec38d2fe7972`;
- tree: `5b3d02b9ff036d08641d07ffda3b0f6d607354b3`;
- Render deploy: `dep-da8lf33tqb8s73d2sikg`;
- migration files: **89**;
- `schema_migrations`: **89**;
- pending migrations: **0**;
- checksum mismatches: **0**.

Migration 085 physical state is exact. Its original physical-DDL transaction was catalog transaction `73856`; the execution source remains materially unexplained and must not be rewritten as known history. The reconciled ledger `applied_at` is ledger-reconciliation time, not the original DDL execution time.

## Calendar CRM V2 production contract

For the new Calendar booking path:

- CRM V2 is the canonical client-resolution boundary;
- exact normalized South African mobile is the sole automatic identity key;
- new V2 appointments write `crm_v2_client_id`;
- new V2 appointments leave legacy `client_id` null;
- no shadow legacy client/contact dual-write is created;
- retained legacy appointments remain legacy-readable and were not backfilled;
- server-authoritative mobile acknowledgement, final CRM V2 reread and confirmation guarantees are preserved.

## WhatsApp discovery — registration-only cutover blocked by architecture

WS-30 completed the bounded discovery package and safely stopped before implementation.

Current WhatsApp new-client onboarding still creates a legacy client through `clientIdentityOnboarding.completeOnboarding()` and downstream runtime remains keyed to legacy `client_id` across returning-client resolution, ordinary booking, practitioner approval, appointment management, Couples Massage, packages/enquiries, transition welcome and operational provenance.

`crmV2ClientService.registerWhatsAppClient()` already exists and is tested, but production WhatsApp runtime does not call it.

A registration-only switch would therefore strand a newly registered V2 client after onboarding. Creating a shadow legacy client is prohibited because it would recreate a permanent dual master.

## Current active P0

Issue #531 — `SHILOH-WHATSAPP-CRM-V2-IDENTITY-COMPAT-FOUNDATION-P0`

Owner: **20 — CRM & Identity**

State: **ACTIVE / PHASE A ROUTED**

Objective:

Add the smallest backward-compatible discriminated identity foundation so WhatsApp durable onboarding/resolution can carry exactly one legacy or CRM V2 identity without activating V2 registration yet.

Required foundation:

- legacy compatibility preserved;
- nullable V2 identity persistence where required;
- mutually exclusive legacy/V2 identity model;
- V2 exact-mobile resolution through the canonical CRM V2 service;
- deterministic restart/resume/stale-authority handling;
- model-aware audit/provenance;
- no registration activation;
- no shadow legacy client.

## Sequencing

1. **#531 — 20 / CRM & Identity:** discriminated WhatsApp identity compatibility foundation, no activation.
2. **30 / WhatsApp & Meta Integration:** make the core WhatsApp booking/approval/appointment-management spine V2-aware.
3. **30:** activate CRM V2 registration for new WhatsApp clients only after the core spine is V2-safe.
4. Handle Couples Massage, packages and other legacy-ID-specific capabilities deliberately in bounded follow-on units or explicit fail-closed compatibility; no silent shadow-client creation.
5. Only after Calendar and WhatsApp new operational paths are proven should 00 evaluate retirement of superseded legacy CRM/identity dependencies.

No unrelated P0/P1 work should interrupt this spine unless it removes a blocker, reduces a real dependency, or remediates a genuine production/security risk.
