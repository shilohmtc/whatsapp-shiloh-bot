# Shiloh OS — Project Tracker Addendum — Staff Auth WhatsApp Delivery Repair

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Closed prior unit

`SHILOH-STAFF-CALENDAR-CHRISTEL-PILOT`

State: COMPLETE AS FAILED PILOT / SAFELY RE-LOCKED / DO NOT REDO.

The single genuine challenge authorized by PR #467 was consumed. Christel did not receive the challenge. No second challenge was attempted.

## Controlled repair unit

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR`

Implementation owner: 30 — WhatsApp & Meta Integration.
Support: 40 — Production & DevOps only for rollout/verification.
Acceptance owner: 00 — Control & Reconciliation.
Priority: HIGHEST CURRENT CALENDAR DEPENDENCY.

State: BLOCKED AT GENUINE META/WABA TEMPLATE-CREATION PERMISSION GATE.

## Completed / do not redo

- PR #469 implemented sanitized WhatsApp `value.statuses` processing while preserving existing inbound `value.messages` routing.
- Status callbacks now correlate Meta message ID, sent/delivered/read/failed state, provider timestamp and sanitized provider error evidence.
- Production staff-auth delivery no longer depends on generic free-form WhatsApp transport.
- Exact version-controlled `AUTHENTICATION` OTP contract `shiloh_staff_auth_otp_v1` is required; wrong category/language, pending/unapproved state, drift, duplicates and provider rejection fail closed.
- Challenge TTL remains five minutes and challenge verification remains short-lived and single-use; canonical staff/Admin identity, pilot gates, CSRF/session boundaries and Calendar non-reachability remain intact.
- Focused and full non-mutating CI passed: 1001/1001 tests.
- PR #469 merged to main as `56e47897b0fbd5f48436a29866ab50482ee58f91`.
- Exact Render rollout was verified healthy with migration 078 checksum verification, Google Calendar provider health, repeated `/health` HTTP 200 and clean bounded post-cutover error logs.
- Read-only provider inventory found zero Authentication templates and no exact Shiloh staff-auth template.
- Exactly one Control-authorized template submission attempt was made. Meta rejected it before creation with HTTP 400 / provider code 10: `This WhatsApp Business Account does not have permission to create message template`.
- No staff-auth template was created by that request.
- No real WhatsApp authentication message was sent and no second Christel challenge was attempted.
- The one-shot template audit/provisioning gates were re-locked OFF after the provider response.

## Current blocker

The current WABA does not have permission to create message templates. The exact Authentication OTP template therefore does not exist and cannot yet become approved/sendable.

Do not retry template submission, downgrade to free-form delivery, or repurpose a utility/marketing/booking/reminder template under this unit.

## Holds

All staff Calendar/auth pilot activation controls remain OFF.

No second real Christel challenge is authorized.

No Calendar create/reschedule/cancel/drag-drop, schedule/block/leave writes, broad staff rollout, or Google authority changes are authorized.

## Required next control action

00 — Control & Reconciliation must accept this blocked outcome and authorize a narrow provider-account/template-permission remediation path before 30 performs any further Meta template mutation.

Only after the exact Authentication OTP template exists, is APPROVED, and exact readback passes may 00 authorize one new bounded genuine Christel read-only pilot challenge.

After a successful repeat pilot, route immediately to 10 — Booking & Admin UX for `SHILOH-CALENDAR-CREATE-BOOKING`, including guarded eligibility for Christel to book eligible clients for herself or with Abigail.