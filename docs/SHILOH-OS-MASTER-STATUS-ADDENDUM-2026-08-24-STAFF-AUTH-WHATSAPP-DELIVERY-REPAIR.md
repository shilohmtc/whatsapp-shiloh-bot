# Shiloh OS — Master Status Addendum — Staff Auth WhatsApp Delivery Repair

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Authoritative operational truth

The secure browser staff/Admin session boundary, Calendar access UX, canonical-account pilot gate and existing Calendar security architecture remain implemented and verified live.

The first genuine Christel read-only staff Calendar pilot remains COMPLETE AS FAILED PILOT / SAFELY RE-LOCKED / DO NOT REDO. The single challenge authorized by PR #467 was consumed; no second challenge has been attempted.

## Delivery repair now live

PR #469 completed the application-side delivery repair and merged as `56e47897b0fbd5f48436a29866ab50482ee58f91`.

Verified behavior now includes:

- WhatsApp status-only `value.statuses` callbacks are handled separately from inbound `value.messages`;
- sent/delivered/read/failed status, provider timestamp and sanitized provider error evidence correlate by Meta message ID;
- inbound WhatsApp message routing remains unchanged;
- authentication codes, full recipient phone numbers, authentication message bodies, session/CSRF tokens and provider credentials are excluded from repair evidence/logging;
- production staff-auth challenge delivery is exact-template controlled and does not use generic free-form WhatsApp transport;
- the required contract is a dedicated Meta `AUTHENTICATION` copy-code OTP template, `shiloh_staff_auth_otp_v1`, language `en_US`, with five-minute OTP expiry/message TTL controls;
- production delivery fails closed unless the exact template is approved, correctly categorized/languaged, non-duplicated and exact on provider readback;
- all existing session, challenge TTL/single-use, canonical identity, pilot allowlist, CSRF, cookie, revocation, ADMIN_API_KEY isolation and Calendar authority protections remain intact.

CI passed the complete non-mutating suite: 1001/1001 tests.

The merged repair was verified live on Render with migration 078 checksum verification, Google Calendar provider health, repeated `/health` HTTP 200 and clean bounded error-level logs.

## Provider truth / genuine blocker

A read-only inspection of the current WABA found zero Authentication-category templates and no exact Shiloh staff-auth OTP template.

Control had authorized exactly one template submission if that condition was proven. Exactly one submission attempt was made. Meta rejected the request before template creation with:

- HTTP status: 400
- provider code: 10
- sanitized provider title/message: `This WhatsApp Business Account does not have permission to create message template`

Therefore the exact staff authentication OTP template does not currently exist and cannot be approved/sendable under the present WABA permission state.

No real recipient message was sent. No second Christel challenge was attempted. The one-shot audit/provision startup gates were re-locked OFF after the provider response.

## Current state

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR` is BLOCKED AT GENUINE META/WABA TEMPLATE-CREATION PERMISSION GATE.

The application repair is complete and live. The remaining blocker is provider/account authority, not application delivery code.

Do not retry template submission, fall back to free-form authentication delivery, or reuse unrelated utility/marketing/booking/reminder templates without a new explicit Control unit.

All staff browser pilot/auth/Calendar production activation gates remain OFF.

## Required next ownership

Next owner: 00 — Control & Reconciliation for acceptance and authorization of a narrow provider-account/template-permission remediation unit. 30 — WhatsApp & Meta Integration should resume only after that authority is explicit; 40 — Production & DevOps is support only where provider configuration rollout/verification requires it.

Only after the exact Authentication OTP template exists, is APPROVED and exact provider readback passes may 00 authorize one new bounded genuine Christel read-only pilot challenge.

On a successful repeat pilot, route immediately to 10 — Booking & Admin UX for `SHILOH-CALENDAR-CREATE-BOOKING`, preserving canonical practitioner eligibility, availability, conflict, approval and provider guards for Christel booking eligible clients for herself or with Abigail.