# Shiloh OS — Project Tracker Addendum — Staff Auth WABA Template Permission Remediation

Date: 2026-08-24
Owner: 00 — Control & Reconciliation

## Closed prior unit

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR`

State: APPLICATION COMPLETE / VERIFIED LIVE / PROVIDER-BLOCKED / DO NOT REDO.

PR #469 completed the application repair. PR #470 reconciled the provider gate. Full non-mutating regression passed 1001/1001. Production is LIVE on current main `01f60a4d56b1c32847cda254ac45851463dd490e` via deploy `dep-da6abi9srm7s73er9pog`.

Provider inventory found zero Authentication templates. The single authorized `shiloh_staff_auth_otp_v1` creation attempt was rejected before creation with HTTP 400 / Meta code 10 because the WABA lacks permission to create message templates.

## Active next unit

`SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION`

State: AUTHORIZED FOR IMPLEMENTATION NOW.

Owner: 30 — WhatsApp & Meta Integration.
Support: 40 — Production & DevOps only where required.
Acceptance: 00 — Control & Reconciliation.
Priority: HIGHEST CURRENT CALENDAR DEPENDENCY.

## Objective

Prove the exact Meta/WABA account or permission condition causing template-creation denial and resolve only the minimum provider-side condition required to restore template-creation capability.

## Guardrails

- No new template submission is authorized in this unit.
- No genuine staff-auth message or Christel challenge is authorized.
- No fallback to free-form authentication delivery.
- No unrelated Utility/Marketing/booking/reminder template reuse.
- No broad user/system-user/token/asset/ownership permission mutation without a separate exact 00 authorization.
- Calendar/pilot/auth activation controls remain OFF.

## Required evidence

30 must return sanitized evidence identifying the actual provider cause and either:

- proof that template creation capability is restored without broadening identity/access/security boundaries; or
- the exact minimum external/admin/security-sensitive mutation still required.

Do not stop at an intermediate `In progress` checkpoint while executable diagnostic/remediation work remains and no genuine provider/admin/authorization gate exists.

## Priority sequence

1. NOW — restore WABA template-creation capability.
2. 00 acceptance.
3. Separate exact one-template creation authorization for `shiloh_staff_auth_otp_v1`.
4. Meta APPROVED + exact readback.
5. One newly authorized bounded Christel read-only pilot.
6. On successful pilot, 10 implements `SHILOH-CALENDAR-CREATE-BOOKING` immediately.
7. Christel production booking activation after guarded proof.
8. Broader rollout and secondary Calendar mutations later.
