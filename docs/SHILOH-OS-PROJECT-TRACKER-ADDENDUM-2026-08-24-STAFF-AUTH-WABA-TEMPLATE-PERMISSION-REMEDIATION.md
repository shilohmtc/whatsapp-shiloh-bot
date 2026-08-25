# Shiloh OS — Project Tracker Addendum — Staff Auth WABA Template Permission Remediation

Date: 2026-08-25
Owner: 00 — Control & Reconciliation

## Closed prior unit

`SHILOH-STAFF-AUTH-WHATSAPP-DELIVERY-REPAIR`

State: APPLICATION COMPLETE / VERIFIED LIVE / PROVIDER-BLOCKED / DO NOT REDO.

PR #469 completed the application repair. PR #470 reconciled the provider gate. The exact Authentication OTP template still does not exist and no additional template creation attempt is authorized.

## Current controlled unit

`SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION`

State: CONTROL-ACCEPTED / BLOCKED AT PROVEN META BUSINESS VERIFICATION GATE / JP EXTERNAL PROVIDER ACTION REQUIRED.

Owner: 30 — WhatsApp & Meta Integration.
External provider actor: JP, under bounded 00 authorization.
Support: 40 — Production & DevOps only where required.
Acceptance: 00 — Control & Reconciliation.
Priority: HIGHEST CURRENT CALENDAR DEPENDENCY.

## Diagnostic implementation and verification

PR #472 added a default-off, GET-only, sanitized provider permission audit and is merged.

Application authority after PR #472: `2c9468363065531f5e56244e17f83bf306ff9a7a`.

CI passed Node 24.14.1 with full non-mutating regression 1007/1007, zero failures/cancellations/skips and zero npm vulnerabilities.

Baseline deploy `dep-da6ai7cs728c73f606hg` was verified live with the audit OFF. The one bounded read-only audit was then run with `META_WABA_TEMPLATE_PERMISSION_AUDIT_ON_START=true`, after which the flag was immediately restored to `false`. Re-lock deploy `dep-da6fr2710e5c73bit11g` is LIVE and healthy on the same exact application commit.

PR #473 reconciled the provider diagnosis. Authoritative main at the specialist return was `e4e449b3127dc6e14358ce75aff1dd822c19e066`, with exact-main Render deploy `dep-da6fsc0u01pc73d4mqgg` LIVE.

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

## 00 Control acceptance and authorization

00 accepts the diagnosis as authoritative and closes further Shiloh diagnostic implementation under this unit.

Durable Control authorization is recorded in `docs/SHILOH-OS-RECONCILIATION-2026-08-25-META-BUSINESS-VERIFICATION-CONTROL-AUTHORIZATION.md`.

JP is authorized to remediate only the existing rejected Meta Business verification through authenticated Meta Business administration by:

1. inspecting the rejection and Meta-requested remediation requirements;
2. correcting factual business-verification information only where supported by authoritative business records and required for verification;
3. submitting/resubmitting the existing Business verification;
4. uploading only supporting business documents specifically required by Meta;
5. using the available appeal/review route; or
6. opening the appropriate Meta Business Support case if Meta exposes no direct correction/resubmission/appeal route.

This authorization does not permit speculative token, role, system-user, asset-assignment, ownership, credential, phone-registration or WABA-sharing changes.

## Current external gate

JP must complete the Meta Business verification remediation manually in the authenticated provider interface.

The external step is complete when either:

- Meta reports Business verification as verified/approved; or
- no direct remediation path exists and JP has opened the appropriate Meta Business Support case.

After Meta reports the business verified, return to 30 for read-only proof that Business verification is verified and the business-level provider limitation has cleared.

## Holds

- No template creation retry.
- No `shiloh_staff_auth_otp_v1` creation/submission.
- No genuine staff-auth WhatsApp message.
- No Christel retry/challenge.
- No free-form OTP fallback.
- No token-scope escalation.
- No human/system-user role or asset-assignment change.
- No WABA ownership/partner-sharing change.
- No phone-registration/ownership change.
- All staff Calendar/auth pilot activation controls remain OFF.
- No Calendar create/reschedule/cancel/drag-drop or Google authority changes.

If Meta requires any of the held security/ownership/access changes to proceed, JP must stop and return the exact requirement to 00 before making it.

## Priority sequence

1. NOW — JP remediates the rejected Meta Business verification under the narrow Control authorization.
2. 30 proves read-only that Business verification is verified and business-level provider health/limitation is restored.
3. 00 separately authorizes exactly one `shiloh_staff_auth_otp_v1` creation.
4. Meta APPROVED + exact Shiloh readback.
5. 00 authorizes one bounded genuine Christel read-only pilot.
6. On successful pilot, 10 implements `SHILOH-CALENDAR-CREATE-BOOKING` immediately.
7. Broader rollout and secondary Calendar mutations remain later.
