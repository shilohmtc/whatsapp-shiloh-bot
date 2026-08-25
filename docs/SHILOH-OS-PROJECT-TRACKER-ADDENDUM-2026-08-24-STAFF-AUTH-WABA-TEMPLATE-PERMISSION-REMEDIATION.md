# Shiloh OS — Project Tracker Addendum — Staff Auth WABA Template Permission Remediation

Date: 2026-08-25
Owner: 00 — Control & Reconciliation

## Closed prior unit

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR`

State: APPLICATION COMPLETE / VERIFIED LIVE / PROVIDER-BLOCKED / DO NOT REDO.

PR #469 completed the application repair. PR #470 reconciled the provider gate. The exact Authentication OTP template still does not exist and no additional template creation attempt is authorized.

## Current controlled unit

`SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION`

State: BLOCKED AT PROVEN META BUSINESS VERIFICATION GATE.

Owner: 30 — WhatsApp & Meta Integration.
Support: 40 — Production & DevOps only where required.
Acceptance: 00 — Control & Reconciliation.
Priority: HIGHEST CURRENT CALENDAR DEPENDENCY.

## Diagnostic implementation and verification

PR #472 added a default-off, GET-only, sanitized provider permission audit and is merged.

Current application authority before this reconciliation: `2c9468363065531f5e56244e17f83bf306ff9a7a`.

CI passed Node 24.14.1 with full non-mutating regression 1007/1007, zero failures/cancellations/skips and zero npm vulnerabilities.

Baseline deploy `dep-da6ai7cs728c73f606hg` was verified live with the audit OFF. The one bounded read-only audit was then run with `META_WABA_TEMPLATE_PERMISSION_AUDIT_ON_START=true`, after which the flag was immediately restored to `false`. Re-lock deploy `dep-da6fr2710e5c73bit11g` is LIVE and healthy on the same exact application commit.

No template creation request, WhatsApp authentication message, genuine challenge, Meta role/scope/asset mutation, ownership change or credential change occurred.

## Exact provider evidence

Sanitized provider evidence proves:

- message-template inventory is readable;
- current token is valid and is a SYSTEM_USER token;
- `whatsapp_business_management` is granted;
- `whatsapp_business_messaging` is granted;
- WABA account review status is `APPROVED`;
- WABA status is `ACTIVE`;
- WABA ownership type is `SELF`;
- Meta business verification status is `rejected`;
- overall provider health is `LIMITED`;
- WABA health entity is `AVAILABLE`;
- APP health entity is `AVAILABLE`;
- BUSINESS health entity is `LIMITED`.

The provider audit could not enumerate business context / assigned-user / system-user task state, so no claim is made that those states are sufficient or deficient. They must not be guessed.

The decisive proven blocker is the rejected Meta Business verification state and associated LIMITED business health.

## Required next action

Do not add token scopes, alter system-user or human-user roles, modify asset assignments, change WABA ownership/sharing or retry template creation as a speculative workaround.

Return to 00 for acceptance and authorization of the minimum external Meta business-verification remediation. JP/Control must review the rejected Business verification in authenticated Meta Business settings, correct/resubmit/appeal the verification using accurate business information and provider-requested evidence, or use Meta Business Support if Meta exposes no direct remediation route.

After Meta reports business verification as verified, return to 30 for read-only provider proof before any template creation. Exactly one `shiloh_staff_auth_otp_v1` creation still requires a fresh separate 00 authorization.

## Holds

- No template creation retry.
- No genuine staff-auth WhatsApp message.
- No Christel retry/challenge.
- No free-form OTP fallback.
- All staff Calendar/auth pilot activation controls remain OFF.
- No Calendar create/reschedule/cancel/drag-drop or Google authority changes.

## Priority sequence

1. NOW — 00/JP remediate the rejected Meta Business verification state.
2. 30 proves read-only that business verification and provider health are restored.
3. 00 separately authorizes exactly one `shiloh_staff_auth_otp_v1` creation.
4. Meta APPROVED + exact Shiloh readback.
5. 00 authorizes one bounded genuine Christel read-only pilot.
6. On successful pilot, 10 implements `SHILOH-CALENDAR-CREATE-BOOKING` immediately.
7. Broader rollout and secondary Calendar mutations remain later.
