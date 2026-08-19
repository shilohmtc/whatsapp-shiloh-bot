# Shiloh OS — Booking-Update Production Activation Reconciliation

Date: 2026-08-19
Status: VERIFIED LIVE / CUSTOMER DELIVERY EVIDENCE OPEN
Owning workstream for activation: Production / DevOps
Reconciliation owner: Control & Reconciliation
Observers: WhatsApp / Meta Integration for provider contract; Booking & Admin UX for any future genuine customer-change journey.

## Purpose

This reconciliation supersedes the prior **production activation gated** wording for `shiloh_booking_update_v1` while preserving all newer safety and provider authority.

The resulting authoritative distinction is:

1. **Provider state — complete:** `shiloh_booking_update_v1` remains APPROVED / existing / exact / duplicate-free and was not resubmitted.
2. **Production configuration — complete and LIVE:** the exact booking-update template name is configured and the explicit booking-update enablement gate is enabled.
3. **Customer delivery evidence — still open:** successful booking-update delivery has not yet been established and may only arise naturally from a genuine change to a still-future appointment.
4. **#575 / audit event 674 — historical only:** the stale notification remains terminally suppressed and must never be used as delivery evidence.

## Accepted runtime baseline preserved

The accepted production application-code baseline remains **PR #332 / `bd6b3963b5ba8a9518d49d9502936521a986a7bb`**, which added terminal suppression for ended booking-update rows while preserving delivery for genuine future appointment changes.

GitHub `main` was **`29cf4ebc249b8b85d66a1616a26e35bd9e9739a0`** throughout the production activation. That commit is the documentation reconciliation from PR #333 and does not supersede the accepted PR #332 runtime-code baseline.

The PR #332 stale-suppression contract remains mandatory:

- ended service/practitioner/time/price update rows are terminally suppressed with `appointment_already_ended`;
- suppressed rows remain unsent and are excluded from retry scans;
- suppression preserves audit/history and does not manufacture successful delivery truth;
- genuine changes to still-future appointments remain eligible for the approved booking-update delivery path.

## Production activation evidence

Production / DevOps executed one Render environment merge update with exactly:

- `WHATSAPP_BOOKING_UPDATE_TEMPLATE=shiloh_booking_update_v1`
- `WHATSAPP_BOOKING_UPDATE_ENABLED=true`

That environment update triggered Render deploy **`dep-da2qovs9v7es73cqlrr0`** with trigger **`api`** on GitHub commit `29cf4ebc249b8b85d66a1616a26e35bd9e9739a0`.

The deploy reached **LIVE at 2026-08-19 15:16:16 SAST**. Post-restart health checks returned HTTP 200. Read-only Render verification also confirmed:

- Google Calendar provider health passed on the restarted instance;
- startup booking-update provider verification reported `submitted=false`, `reason=already_exists`, `providerStatus=APPROVED`;
- no Meta template resubmission occurred;
- no unexpected booking-update send/failure/suppression event appeared in the immediate activation startup window.

The existing provider contract remains authoritative:

- identity: `shiloh_booking_update_v1`;
- category/language: Utility / `en`;
- exact component contract reconciled;
- `duplicateCount=0`;
- provider quality `UNKNOWN`;
- provider identity existed already and was not resubmitted.

## Queue safety immediately before activation

Immediately before the environment activation, authoritative production read-only evidence established:

- `active_booking_update_rows=0`;
- appointment **#575 / audit event 674** remained `suppressed`;
- suppression reason remained `appointment_already_ended`;
- `sent_at=null`.

Therefore the activation did not release a queued active booking-update row at startup.

Appointment #575 / 674 remains genuine historical queue evidence only. It is **terminally suppressed**, must remain unsent, and must never be presented as successful delivery evidence. Do not release it, mark it sent, mutate the appointment for proof, or create a replacement journey.

## Current production delivery contract

Booking-update production configuration is now **LIVE / ENABLED**.

The runtime path still requires the existing fail-closed contracts: canonical customer-change outbox state, appointment validity, exact provider template contract, provider approval/readiness, client/contact validity and all existing send/idempotency guards.

Successful customer booking-update delivery evidence remains **OPEN**. It may only close when a naturally occurring service, practitioner, time or price change for a **still-future appointment** produces genuine production delivery evidence. No synthetic appointment change, test booking, forced retry or WhatsApp send may be manufactured for closure evidence.

The deterministic operational kill switch is:

`WHATSAPP_BOOKING_UPDATE_ENABLED=false`

That kill switch may be used by the owning Production / DevOps workstream when an authorized operational decision requires booking-update delivery to fail closed again. This reconciliation does not change it.

## Completed — do not redo

The following booking-update work is complete unless newer contradictory evidence appears:

- exact Meta provider contract reconciliation;
- Meta provider approval;
- duplicate-free provider identity verification;
- no-resubmission confirmation;
- stale ended-row suppression repair from PR #332;
- production template-name configuration;
- production booking-update enablement;
- activation deploy and post-restart health/provider verification.

Do not resubmit the Meta template, recreate #575, re-run the production activation merely for proof, or manufacture a booking-update journey.

## Remaining evidence gate and ownership

There is no remaining implementation, Meta-approval or production-activation gate for `shiloh_booking_update_v1`.

The only booking-update-specific open item is **successful natural customer delivery evidence**.

- **Booking & Admin UX** owns the genuine future business journey when one occurs naturally.
- **WhatsApp / Meta Integration** owns provider/send evidence verification for that natural journey.
- **Production / DevOps** owns runtime health, configuration and incident response, including the deterministic enablement kill switch.
- **Control & Reconciliation** tracks shared authority and must not convert absence of a natural journey into manufactured evidence work.

## Documentation-only reconciliation boundary

This Control unit changes documentation/reconciliation only. It does not alter runtime code, Render environment variables, Meta/provider configuration, CRM data, appointments or WhatsApp state.

Because Render auto-deploys `main` on commits, the eventual documentation merge is expected to create a normal `new_commit` deployment. That docs-only deployment must be verified healthy after merge and does not supersede PR #332 as the accepted runtime-code baseline unless runtime code changes are independently established.

## Final activation-state checkpoint

- **Authoritative now:** booking-update production configuration is LIVE / ENABLED; provider remains APPROVED / existing / exact / duplicate-free / no resubmission.
- **Completed / do not redo:** provider approval, stale-row safety repair, production template configuration and explicit enablement are complete.
- **Historical only:** #575 / 674 remains terminally suppressed with `appointment_already_ended`, `sent_at=null`, and can never serve as delivery evidence.
- **Still open:** successful customer delivery evidence from a genuine change to a still-future appointment.
- **Kill switch:** `WHATSAPP_BOOKING_UPDATE_ENABLED=false`.
- **No manufactured evidence:** no synthetic booking change or WhatsApp journey is authorized for closure.