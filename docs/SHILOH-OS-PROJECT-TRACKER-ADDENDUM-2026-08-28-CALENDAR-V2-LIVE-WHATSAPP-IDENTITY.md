# Shiloh OS Project Tracker Addendum — 2026-08-28 — Calendar V2 Live / WhatsApp CRM V2 Transition

Controlled unit: `SHILOH-CALENDAR-V2-LIVE-WHATSAPP-IDENTITY-RECONCILIATION`

Owner: **00 — Control & Reconciliation**

Status: **RECONCILED — WHATSAPP CLEAN CRM V2 REGISTRATION LIVE / NO CUTOVER P0 ACTIVE**

## Terminal CRM V2 production sequence

| Issue | Controlled unit | Owner | Terminal state | Do not redo |
|---|---|---|---|---|
| #526 | `SHILOH-CALENDAR-CLEAN-CRM-V2-CUTOVER-P0` | 10 — Calendar & Booking Assurance | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #529 | `SHILOH-CALENDAR-CRM-V2-MIGRATION-085-P0` | 40 — Production & DevOps | PASS / CLOSED / 89 OF 89 | Yes |
| #531 | `SHILOH-WHATSAPP-CRM-V2-IDENTITY-COMPAT-FOUNDATION-P0` | 20 — CRM & Identity | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #534 | `SHILOH-WHATSAPP-CRM-V2-IDENTITY-MIGRATION-086-P0` | 40 — Production & DevOps | PASS / CLOSED / 90 OF 90 | Yes |
| #535 | `SHILOH-WHATSAPP-CRM-V2-CORE-BOOKING-SPINE-COMPAT-P0` | 30 — WhatsApp & Meta Integration | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #538 | `SHILOH-WHATSAPP-CRM-V2-RESCHEDULE-COMPAT-P0` | 30 — WhatsApp & Meta Integration | PASS / CLOSED / PRODUCTION LIVE | Yes |
| #541 | `SHILOH-WHATSAPP-CRM-V2-RESCHEDULE-MIGRATION-087-P0` | 40 — Production & DevOps | PASS / CLOSED / 91 OF 91 | Yes |
| #542 | `SHILOH-WHATSAPP-CLEAN-CRM-V2-REGISTRATION-ACTIVATION-P0` | 30 — WhatsApp & Meta Integration | PASS / CLOSED / PRODUCTION LIVE | Yes |

PR #528, #533, #537, #540 and #543 are merged and deployed.

Authoritative production release at this reconciliation:

- `main`: `67069fbe0b650e807060d23eda135d9772a79e20`;
- tree: `45a421937ab929a4dab7ee07ac087074b37d628f`;
- Render deploy: `dep-da8q5sek1f9s73ce1l10` — **LIVE**;
- migration files: **91**;
- `schema_migrations`: **91**;
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

The identity layer provides explicit legacy/V2 discrimination, canonical exact-mobile V2 resolution, deterministic restart/stale-authority handling, model-aware provenance and fail-closed dual-master protection without retained-row backfill.

## Core ordinary WhatsApp lifecycle — terminal

Issues #535, #538 and #541 are complete and production-live.

The ordinary WhatsApp lifecycle supports either retained legacy or canonical CRM V2 identity through booking, practitioner approval, appointment commit, confirmation/lifecycle snapshots, cancellation, reminder confirmation, customer actions, change notifications and practitioner-approved rescheduling.

Final appointment identity remains XOR:

- legacy → `appointments.client_id` populated and `appointments.crm_v2_client_id` null;
- CRM V2 → `appointments.client_id` null and canonical `appointments.crm_v2_client_id` populated.

Migration 087 is deployed exactly once with checksum:

`604fa879a6ef1afd8851a883afb45e2ebe63c42a11ff23bf27a82825eb11de78`

The reschedule request model now supports exactly one retained legacy or CRM V2 identity with no historical backfill/conversion.

## New WhatsApp registration cutover — terminal

Issue #542 and PR #543 are complete and production-live.

New/unbound WhatsApp registration now uses:

`crmV2ClientService.registerWhatsAppClient()`

as the sole canonical new-registration write boundary.

Required production behavior now is:

- verified inbound WhatsApp sender mobile uses canonical South African mobile normalization;
- exact-mobile locking/resolution/create/update remains owned by CRM V2;
- one existing exact-mobile CRM V2 owner is completed/updated in place rather than duplicated;
- conflict/stale/missing/different-owner authority fails closed;
- durable onboarding persists `client_id = NULL`, canonical `crm_v2_client_id`, `identity_model = 'crm_v2'`;
- booking continuation occurs only after durable persistence and exact-mobile revalidation;
- new/unbound registration no longer creates a legacy `clients` row with `source='whatsapp_onboarding'`;
- no legacy `client_contacts` row is created solely to support new registration.

Production startup on the exact release reports `crmV2RegistrationActive:true` and `registrationBoundary:crmV2ClientService.registerWhatsAppClient`, then starts normally.

No synthetic production client/message/appointment was created for proof. Legitimate live WhatsApp registrations after activation may now create canonical CRM V2 clients through normal product behavior.

## Retained legacy compatibility

Retained verified legacy clients remain legacy. Existing legacy appointments/history, imported-client repair semantics and identity evidence remain supported.

Do not bulk-import, backfill, convert or delete retained legacy client data merely because the new Calendar and WhatsApp operational paths use CRM V2.

No shadow legacy master is allowed for a CRM V2 client.

## Special retained legacy-only capabilities

Couples Massage, package entitlement/booking and enquiry/lead paths remain explicit CRM V2 fail-closed special-case boundaries where they still depend on retained legacy IDs.

They are **not an active P0 by default**.

Open future bounded work only if operational necessity and business value justify the added lifetime complexity. Do not manufacture legacy compatibility records simply to avoid an explicit boundary.

## Current active P0

**None for the Calendar/WhatsApp Clean CRM V2 cutover.**

Preferred current posture:

**STABILIZE / OBSERVE / DO NOT GROW ADJACENT SCOPE.**

If production evidence exposes a real defect, route the smallest owning-stream remediation. Otherwise do not create additional CRM V2 work merely to broaden feature parity.

## Sequencing from here

1. Stabilize and observe the production-live Calendar + WhatsApp Clean CRM V2 operational spine.
2. Treat any real production defect as a bounded owning-stream remediation, not a reopening of completed migration work.
3. Evaluate Couples Massage, packages and enquiries only when their business value earns the implementation/maintenance cost.
4. Evaluate legacy CRM/identity retirement only after retained dependencies are proven unnecessary and a separate bounded retirement case exists.
5. Physical Google provider/environment disconnection remains a separate JP-only retirement decision and is not required for CRM V2 operation.

No unrelated P0/P1 work should interrupt stabilization unless it removes a blocker, reduces a real dependency, or remediates a genuine production/security risk.
