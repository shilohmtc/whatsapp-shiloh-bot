# Shiloh OS — Booking Confirmation v2 Controlled Meta Submission Reconciliation

Date: 2026-08-20
Status: PROVIDER PENDING / EXACT / DUPLICATE-FREE / PRODUCTION ACTIVATION BLOCKED
Owning workstream: WhatsApp / Meta Integration
Governance baseline: PR #340 / `aeb4e35361c34413d4310b1846c7043642a31cd2`

## Authority and scope

This reconciliation records one controlled Meta submission for `shiloh_booking_confirmation_v2`. It preserves all newer GitHub `main`, CRM, welcome-routing, booking-update, catalogue, attendance and governance authority. It does **not** supersede `shiloh_booking_confirmation_v1`, which remains the configured and active production booking-confirmation fallback.

The frozen v2 provider contract is:

- name: `shiloh_booking_confirmation_v2`;
- language: `en`;
- category: `UTILITY`;
- static text header: `Appointment confirmed`;
- exactly five BODY variables: client name, service, practitioner, date and time;
- no raw URL in the BODY;
- footer: `Shiloh Massage Therapy & Aesthetic Clinic`;
- QUICK_REPLY buttons in exact order: `Add to calendar`, `Manage booking`, `My appointments`;
- no marketing, upsell or `Book another` wording.

The body is exactly:

```text
Hi {{1}}, your Shiloh appointment is confirmed. 🌿

✨ Service: {{2}}
👤 Practitioner: {{3}}
📅 Date: {{4}}
🕐 Time: {{5}}

Use the options below to add this appointment to your calendar or manage your booking.

We look forward to welcoming you. 🌿
```

## Local contract and handler preparation

PR #343 — **Prepare booking confirmation v2 Meta contract** — froze the contract before provider submission and preserved v1 as the live delivery path.

Durable behavior introduced by #343:

- `shiloh_booking_confirmation_v2` is registered in the centralized Meta inventory but deliberately `sendable=false`;
- the current production selector remains `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE=shiloh_booking_confirmation_v1`;
- provider approval by itself cannot make v2 sendable or ready;
- `Add to calendar` uses appointment-scoped payloads and delegates to the existing Google Calendar / Apple-Outlook CTA presentation with client-phone ownership revalidation;
- `Manage booking` is non-mutating on first tap and exposes the existing guarded `Reschedule`, `Cancel booking`, and `My appointments` action IDs;
- `My appointments` continues to use the existing deterministic appointment view;
- no duplicate booking, Calendar, cancellation, reschedule or appointment-view business logic was introduced;
- a one-shot provider gate, `META_BOOKING_CONFIRMATION_V2_PROVISION_ON_START=true`, is required before any v2 provider submission attempt.

PR #343 head `ec656b9d56e9a5e58355ff4372398e3699935ce2` passed full CI #1093: **716 passed / 0 failed**. It merged as `311ce80030b4ef7600d55b8a73e895729d22b595`. Render auto-deploy `dep-da381jj7uimc73bedffg` reached LIVE with the one-shot submission flag still off; no v2 provisioning event occurred.

PR #344 — **Verify booking confirmation v2 provider contract after submission** — added a sanitized immediate provider read-back after a new POST, including actual provider status/category/language, semantic components, exactness and duplicate count. CI #1095 passed **717 passed / 0 failed**. It merged as `3cf8dbce36c58d9f52c07951481d171d28d61539`, and inert auto-deploy `dep-da382vu7bikc738s3te0` reached LIVE before submission.

Focused regression covers exact copy/header/footer/button order, exactly five variables, no URL/marketing/`Book another` body leakage, long realistic values, appointment-scoped payload normalization, non-mutating canonical handler delegation, v2 non-sendability, exact-existing no-resubmit behavior, provider-drift and duplicate fail-closed behavior, exactly one POST when absent, and post-POST provider contract read-back.

## Controlled Meta submission

Only after the local contract and both applicable CI gates were green, Production runtime was given the one-shot submission flag:

`META_BOOKING_CONFIRMATION_V2_PROVISION_ON_START=true`

No booking-confirmation production selector was changed. In particular, this controlled unit did **not** set `WHATSAPP_BOOKING_CONFIRMATION_TEMPLATE` to v2 and did not make v2 sendable.

Render environment deploy `dep-da383btg1s2s73d19cn0` reached LIVE on the already-merged `3cf8dbce...` code. Startup recorded:

- `submitted=true`;
- `reason=submitted`;
- template `shiloh_booking_confirmation_v2`;
- provider submission response `PENDING` / `UTILITY`.

This is the single Meta POST authorized by this unit.

## Immediate read-only provider verification

At 2026-08-20 06:25:51 SAST, the post-submission provider read-back returned:

- name: `shiloh_booking_confirmation_v2`;
- status: **PENDING**;
- category: **UTILITY**;
- language: **en**;
- exact contract: **true**;
- `duplicateCount=0`;
- HEADER: text / `Appointment confirmed`;
- BODY: exact frozen five-variable body above;
- FOOTER: `Shiloh Massage Therapy & Aesthetic Clinic`;
- BUTTONS in exact order: QUICK_REPLY `Add to calendar`, QUICK_REPLY `Manage booking`, QUICK_REPLY `My appointments`.

No provider duplicate, semantic drift or alternate-language variant was observed in that verification.

Because provider status is PENDING, **production activation is blocked**. PENDING is not APPROVED; exact provider acceptance is not production configuration; and neither would constitute handset delivery evidence.

## Submission gate closed again / v1 preserved

Immediately after the verified submission/read-back, `META_BOOKING_CONFIRMATION_V2_PROVISION_ON_START` was set back to `false`. Render deploy `dep-da383pdg1s2s73d1a40g` reached LIVE.

On the flag-off restart, the established v1 provisioning check reported:

- template `shiloh_booking_confirmation_v1`;
- configured template `shiloh_booking_confirmation_v1`;
- provider status **APPROVED**;
- category **UTILITY**;
- `submitted=false`;
- `reason=already_exists`.

There was no v2 provisioning log on that restart. v2 remains hard fail-closed as non-sendable in the centralized registry.

## Production activation gate

Do **not** activate `shiloh_booking_confirmation_v2` while provider status is PENDING.

A later activation decision requires fresh authoritative evidence establishing all of the following together:

1. provider status **APPROVED**;
2. provider name/language/category/components still exactly match the frozen contract;
3. `duplicateCount=0`;
4. a deliberate production configuration plan for the v2 selector/handler payloads;
5. v2 promoted from non-sendable only by an explicit reviewed code/config activation change;
6. existing v1 fallback preserved until that activation is verified;
7. no manufactured booking or handset journey used merely to produce evidence.

The separate Booking & Admin UX idea to suppress four redundant post-v1 supplemental message groups is outside this controlled Meta-submission unit. The approved Meta v1 template itself was not changed here.

## Control-boundary audit note

During initial branch setup, a one-line file `docs/.placeholder-booking-confirmation-v2` containing only `temporary` was accidentally committed directly to `main` as `9e45a306a6c3fb69ec66753b64e87b2cbc9552ec`. It was immediately removed by corrective commit `e71e31ec7cb1dbcea3648651479a5c8bc6537a5c` before the actual feature branch was created.

Those commits caused ordinary Render auto-deploy churn (`dep-da37v6gae00c73fr8cu0` then `dep-da37v8nesehs738slvhg`) but contained no application code, Meta configuration, template submission, booking mutation or WhatsApp send. This remains part of the audit trail and must not be normalized away.

## Completed / do not redo

- Do not redefine the v2 copy, variable count, footer or button order without a new approved Booking & Admin UX decision.
- Do not resubmit while an exact provider identity already exists.
- Do not treat PENDING as APPROVED.
- Do not switch production from v1 merely because v2 exists at Meta.
- Do not duplicate Calendar/manage-booking/My appointments business logic.
- Do not manufacture a booking or handset interaction to prove v2 delivery.
- Do not repeat the one controlled submission performed by this unit.

## Completion boundary / PR #340 handoff

**Authoritative current state:** local v2 preparation is merged and production-live but non-sendable; exactly one provider submission occurred; immediate Meta read-back is **PENDING / UTILITY / en / exact / duplicate-free**; the one-shot provisioning flag is back to `false`; v1 remains configured, APPROVED and active.

**Unresolved gate:** Meta approval. No Production / DevOps activation work is actionable while the provider status remains PENDING.

**Next owner:** WhatsApp / Meta Integration remains the monitoring owner for the external Meta approval state. No specialist-to-specialist Proceed handoff is issued yet. When a future read-only check establishes APPROVED + exact + duplicate-free, a separately approved Production / DevOps activation decision may then be routed under PR #340.

**Next specialist: None — current controlled submission unit complete; external Meta approval remains fail-closed.**
