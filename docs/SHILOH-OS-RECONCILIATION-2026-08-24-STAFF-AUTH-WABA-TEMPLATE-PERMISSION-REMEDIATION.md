# Shiloh OS — Control Reconciliation — Staff Auth WABA Template Permission Remediation

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Control disposition

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR` is ACCEPTED AS APPLICATION-COMPLETE / VERIFIED LIVE / PROVIDER-BLOCKED / DO NOT REDO.

The application repair from PR #469 and reconciliation from PR #470 remain authoritative. Current main at acceptance is `01f60a4d56b1c32847cda254ac45851463dd490e`.

The remaining blocker is Meta/WABA permission to create message templates, not Shiloh application code.

## Independently verified evidence

- PR #469 merged the delivery repair as `56e47897b0fbd5f48436a29866ab50482ee58f91`.
- PR #469 CI run `32771634113`, job `97573072480`, passed on Node 24.14.1.
- Full non-mutating regression passed 1001/1001 with zero failures, cancellations or skips and zero npm vulnerabilities.
- PR #470 merged reconciliation as current main `01f60a4d56b1c32847cda254ac45851463dd490e`.
- Exact Render deploy `dep-da6abi9srm7s73er9pog` is LIVE on that commit.
- Production startup verified migration 078 checksum state, Google Calendar provider health, Shiloh startup, repeated HTTP `/health` 200 and a clean bounded error-level window.
- Read-only provider inventory found zero Authentication-category templates and no exact `shiloh_staff_auth_otp_v1` template.
- Exactly one previously authorized creation attempt was made; Meta rejected it before creation with HTTP 400 / provider code 10 and sanitized provider evidence: `This WhatsApp Business Account does not have permission to create message template`.
- No template was created, no real authentication message was sent, and no second Christel challenge occurred.

## Completed / do not redo

Do not redo PR #469 implementation, status-only webhook observability, exact OTP template contract, provider inventory, PR #470 reconciliation, or the consumed template-creation attempt.

Do not restore free-form staff authentication delivery and do not repurpose Utility, Marketing, booking, reminder or unrelated templates.

## Next controlled unit

Control authorizes:

`SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION`

Owner: 30 — WhatsApp & Meta Integration.
Support: 40 — Production & DevOps only where Render/runtime verification is genuinely required.
Final acceptance: 00 — Control & Reconciliation.
Priority: NOW — highest current Calendar dependency.

## Authorized scope

30 must first diagnose the exact provider/account condition behind code 10 using read-only or non-sending evidence wherever possible.

The diagnosis must distinguish, without guessing, among materially different causes such as:

- WABA/business account restriction or eligibility state;
- business verification/account quality or provider policy restriction;
- app/token management permission deficiency;
- system-user or human-user asset assignment deficiency;
- WABA ownership/sharing/partner access issue;
- another Meta account-level restriction.

30 may use existing provider inventory, account metadata, token/app permission inspection and Business Manager evidence that does not send messages or create templates.

## Mutation boundary

This unit does NOT authorize another template-creation request.

It also does NOT grant blanket authority to change:

- Business Manager user roles;
- system-user roles or asset assignments;
- app/token scopes;
- WABA ownership or partner sharing;
- phone-number ownership/registration;
- provider credentials;
- business ownership;
- broad Meta permissions.

If the exact remediation is a security-sensitive permission, role, token, ownership or asset-access change, 30 must return the precise minimum mutation and evidence to 00 for explicit authorization before making it.

If Meta exposes a narrowly scoped provider-side enablement/remediation that does not alter identity, credentials, roles, ownership or access scope, 30 may complete that provider remediation within this unit, then verify read-only that template creation capability is restored. Do not submit the template yet.

## Required completion evidence

The unit must end with one of two outcomes:

1. REMEDIATED: exact provider evidence proves the WABA can create message templates again without weakening security or access boundaries; or
2. BLOCKED: exact provider evidence identifies the unresolved external/admin action and the minimum Control/JP action required.

In either case, preserve all Calendar/auth pilot gates OFF and do not send a real WhatsApp authentication message.

## Follow-on authority sequence

Only after 00 accepts restored template-creation capability may 30 receive a new exact authorization to submit/create `shiloh_staff_auth_otp_v1` once and verify exact provider readback.

Only after the template is APPROVED, exact, configured and sendable may 00 authorize one new bounded genuine Christel read-only pilot challenge.

After a successful Christel pilot, route immediately to 10 — Booking & Admin UX for `SHILOH-CALENDAR-CREATE-BOOKING`, including guarded Christel bookings for herself and eligible Abigail services.

## Still not authorized

- another staff-auth template creation attempt;
- another genuine Christel authentication challenge;
- broad staff Calendar rollout;
- permanent Calendar activation;
- Calendar create/reschedule/cancel/drag-drop;
- practitioner/service reassignment;
- schedule/block/leave/closure writes;
- Google Calendar authority weakening, mirror removal or optionality.
