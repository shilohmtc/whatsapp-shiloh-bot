# Shiloh OS — Booking Confirmation v1 Delivery Polish Reconciliation

Date: 2026-08-20
Status: VERIFIED LIVE / V1 DELIVERY SIMPLIFIED / V2 PROVIDER GATE PRESERVED
Owning workstream: Booking & Admin UX
Governance baseline: PR #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2`

## Authority and scope

This reconciliation records the controlled simplification of the live `shiloh_booking_confirmation_v1` customer delivery path after the separately controlled `shiloh_booking_confirmation_v2` Meta submission. It preserves all newer authority on GitHub `main`, including PR #346 / #347 client-reschedule practitioner-approval dark deployment and schema verification.

The approved Meta `shiloh_booking_confirmation_v1` template itself is unchanged. The production selector remains `shiloh_booking_confirmation_v1`. The v2 provider contract is also unchanged by this unit and remains last-authoritatively **PENDING / UTILITY / `en` / exact / `duplicateCount=0`**, deliberately non-sendable and production inactive.

## Problem and accepted UX decision

Before this repair, successful v1 booking confirmation delivery was followed by four additional WhatsApp message groups:

1. Google Calendar CTA;
2. Apple / Outlook CTA;
3. Reschedule / Cancel booking buttons;
4. Book another / My appointments / Main menu buttons.

Those supplements duplicated information/actions already available through the established client navigation and made the live confirmation journey unnecessarily noisy while v2 was under Meta review.

The frozen Booking & Admin UX decision was to suppress those four groups for the exact live v1 template path without editing or resubmitting the approved Meta v1 template.

## Implementation

PR #348 — **Polish live v1 booking confirmation delivery** — was based on the then-current PR #347 production head `a7bf72cd05f06bb566d3cc1810363c5fe09c51a0`.

The implementation in `src/services/customerBookingConfirmation.js`:

- identifies the exact live identity `shiloh_booking_confirmation_v1`;
- performs the primary booking-confirmation provider send exactly as before;
- suppresses the four legacy supplemental message groups only for that exact v1 identity;
- records `supplementalActionsSuppressed=true` in the durable booking-confirmation audit metadata for the v1 path;
- preserves the existing confirmation delivery claim/idempotency semantics;
- preserves the non-template fallback action block;
- leaves reusable calendar, reschedule/cancel, My appointments and post-booking canonical handlers available outside automatic v1 delivery;
- does not edit the v1 Meta definition, its seven parameters, production template selector, v2 contract, v2 submission gate, appointment data, CRM data or Render environment configuration.

## Regression and CI

Focused regression verifies:

- exact `shiloh_booking_confirmation_v1` suppresses all four redundant supplemental groups;
- the approved Meta v1 copy/parameter contract remains unchanged;
- canonical Calendar and booking-change action services remain available independently;
- the non-template fallback still retains the existing supplemental action block;
- lifecycle/button parity remains intact outside the automatic v1 path.

Full GitHub CI #1116 passed **737 / 737, 0 failed** on PR #348, including every then-current PR #346/#347 client-reschedule approval and schema-bootstrap regression.

Any `APPROVED` booking-confirmation-v2 status printed inside CI is synthetic fixture data from provider-contract tests and is not production Meta evidence. It does not supersede the last authoritative production v2 status of PENDING.

## Merge and production verification

PR #348 merged as:

`de624ccdd51834841f2a94355afa48d13d2b0f3d`

Render auto-deploy `dep-da397up42hec73aplkkg` deployed that exact commit and reached **LIVE** without a manual deploy or environment mutation.

Production startup verification established:

- `/health` returned HTTP 200 on the new instance;
- Google Calendar provider health passed;
- `shiloh_booking_confirmation_v1` remained configured as the production booking-confirmation template;
- provider status remained **APPROVED / UTILITY**;
- provisioning returned `submitted=false`, `reason=already_exists`;
- no Meta template submission occurred;
- PR #347 reschedule-approval schema verification remained healthy;
- migration `064_client_reschedule_practitioner_approval.sql` remained checksum-verified and already applied;
- reschedule approval remained `featureEnabled=false`;
- both reschedule-approval template configuration booleans remained false.

No appointment or booking was created, changed or cancelled merely to obtain handset evidence. Therefore this unit establishes code/CI/deploy/runtime readiness and the exact live routing rule; a future naturally occurring v1 booking confirmation may provide handset observation without being manufactured for proof.

## Preserved provider and activation boundaries

### Booking confirmation v1

- Meta identity: `shiloh_booking_confirmation_v1`;
- provider: **APPROVED / UTILITY**;
- production selector: still v1;
- template body/variables: unchanged;
- automatic post-confirmation supplemental groups: **suppressed by #348**;
- canonical actions: retained elsewhere in the application;
- do not resubmit or edit v1 merely to reproduce this behavior.

### Booking confirmation v2

The last authoritative production provider evidence remains:

- `shiloh_booking_confirmation_v2`;
- **PENDING**;
- `UTILITY` / `en`;
- exact frozen header/body/footer/buttons;
- `duplicateCount=0`;
- `sendable=false` / `ready=false`;
- one-shot provisioning flag restored to false;
- not selected for production.

Do not infer v2 APPROVED from CI fixtures. Do not resubmit while the exact provider identity exists. Controlled v2 activation remains blocked until a fresh read-only provider check establishes **APPROVED + exact contract + duplicate-free** together.

### Client reschedule practitioner approval

PR #346 / #347 remain separately preserved as dark-deployed future behavior. Production startup under #348 reconfirmed:

- the schema exists and is checksum-verified;
- `WHATSAPP_RESCHEDULE_APPROVAL_ENABLED` is effectively false;
- approval/decline template configuration is absent;
- no live client-reschedule behavior was activated by this v1 polish.

Do not enable or configure that feature until its own Meta/provider/configuration gate is separately closed.

## Completed / do not redo

- Do not restore the four automatic post-v1 supplemental message groups unless a new explicit UX decision supersedes #348.
- Do not edit or resubmit `shiloh_booking_confirmation_v1` to accomplish this polish; its provider contract was intentionally left unchanged.
- Do not duplicate canonical Calendar, reschedule/cancel or appointment-view handlers.
- Do not activate `shiloh_booking_confirmation_v2` merely because its local contract exists.
- Do not treat CI fixture provider statuses as production Meta truth.
- Do not manufacture a booking or handset journey to demonstrate the reduced message count.
- Do not weaken or enable the separately dark-deployed PR #346/#347 reschedule-approval feature as part of this work.

## Completion boundary / PR #340 handoff

**Authoritative current application state:** PR #348 / `de624ccdd51834841f2a94355afa48d13d2b0f3d` is production-live and full-regression green. The exact live v1 confirmation now sends the approved Meta v1 confirmation without the four redundant automatic supplemental groups. V1 remains configured/APPROVED and its provider contract is unchanged. PR #346/#347 remain dark/default-off. V2 remains last-authoritatively PENDING, exact, duplicate-free and non-sendable.

**Current controlled unit:** complete. No further Booking & Admin UX implementation is required for the v1 polish.

**Next dependency:** external Meta review of booking confirmation v2.

**Owning workstream:** WhatsApp / Meta Integration.

**Exact chat:** `Shiloh OS — WhatsApp / Meta Integration`.

**Ownership reason:** only Meta/provider read-only evidence can close the v2 approval gate; Production / DevOps activation is premature while PENDING.

**Dependencies / observers:** Production / DevOps becomes the activation owner only after WhatsApp / Meta Integration verifies APPROVED + exact + duplicate-free; Control & Reconciliation observes shared-state integrity.

**Status: Blocked — external Meta approval.**

```text
Shiloh OS — WhatsApp / Meta Integration: monitor booking confirmation v2 approval read-only.

Independently re-read current GitHub main, Master Status, Project Tracker, the latest reconciliation, Meta readiness matrix and Engineering Governance. Preserve any authority newer than this handoff; treat this handoff as routing context only.

Verify `shiloh_booking_confirmation_v2` through an authoritative read-only provider surface. Do not submit or resubmit it. Confirm current provider name, language, category, full semantic components, status and duplicate count. The last authoritative production evidence is PENDING / UTILITY / en / exact / duplicateCount=0; CI fixture logs are not provider evidence.

Preserve PR #348 live-v1 delivery polish: `shiloh_booking_confirmation_v1` remains the configured APPROVED fallback and its automatic four supplemental message groups are intentionally suppressed while canonical action handlers remain available elsewhere. Preserve PR #346/#347 reschedule-approval as dark/default-off unless separately authorized.

If v2 is still PENDING, reconcile only genuinely changed evidence and stop fail-closed. If and only if v2 is APPROVED + exact + duplicate-free, reconcile that provider state and issue the PR #340 handoff to Production / DevOps for a separate controlled activation; do not activate v2 in the Meta-monitoring unit and do not manufacture a booking for handset evidence.
```
