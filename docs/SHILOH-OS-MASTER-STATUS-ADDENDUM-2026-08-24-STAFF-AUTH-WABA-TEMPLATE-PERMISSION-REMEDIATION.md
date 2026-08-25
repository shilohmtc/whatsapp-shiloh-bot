# Shiloh OS — Master Status Addendum — Staff Auth WABA Template Permission Remediation

Date: 2026-08-25
Owner: 00 — Control & Reconciliation

## Verified operational truth

The application-side staff-auth WhatsApp delivery repair remains complete and verified live. The exact Authentication OTP template `shiloh_staff_auth_otp_v1` (`en_US`) still does not exist, and no additional creation attempt has been made.

PR #472 added a default-off, GET-only, sanitized Meta/WABA permission diagnostic. CI passed on Node 24.14.1 with full regression 1007/1007, zero failures/cancellations/skips and zero npm vulnerabilities.

The diagnostic was deployed on exact application commit `2c9468363065531f5e56244e17f83bf306ff9a7a`. A clean audit-OFF baseline was verified, one bounded read-only audit was executed, and the audit flag was immediately restored OFF. Re-lock deploy `dep-da6fr2710e5c73bit11g` is LIVE and healthy.

PR #473 reconciled the provider diagnosis. Authoritative main at that reconciliation is `e4e449b3127dc6e14358ce75aff1dd822c19e066`; exact-main deploy `dep-da6fsc0u01pc73d4mqgg` is LIVE.

No template creation request, real authentication message, genuine Christel challenge, provider credential change, token-scope change, role/asset-assignment change, WABA ownership/sharing change or phone-registration mutation occurred.

## Exact Meta provider finding

Sanitized provider evidence proves:

- message-template inventory is readable;
- the token is valid and identifies as a SYSTEM_USER token;
- `whatsapp_business_management` is granted;
- `whatsapp_business_messaging` is granted;
- WABA account review status is `APPROVED`;
- WABA status is `ACTIVE`;
- WABA ownership type is `SELF`;
- Meta business verification status is `rejected`;
- provider health is `LIMITED` because the BUSINESS health entity is `LIMITED` while the WABA and APP health entities are `AVAILABLE`.

The diagnostic could not enumerate the business context, assigned-user tasks or system-user task state. Therefore those states remain unproven and must not be inferred either adequate or deficient.

## Authoritative blocker

`SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION` is CONTROL-ACCEPTED and BLOCKED at a genuine external Meta Business-verification gate.

The directly proven blocker is the rejected Meta Business verification state and associated LIMITED business-level provider health.

Broadening token scopes, changing human/system-user roles, altering WABA asset assignments, changing ownership/sharing, rotating credentials or changing phone ownership/registration is not justified by the evidence and is not authorized as a workaround.

## 00 bounded provider-remediation authority

00 authorizes JP to remediate only the existing rejected Meta Business verification through authenticated Meta Business administration.

Authorized provider actions are limited to:

1. inspecting the existing rejection/reason and Meta-requested remediation requirements;
2. correcting factual Business-verification information only where supported by authoritative business records and required by Meta for verification;
3. submitting or resubmitting the existing Business verification;
4. uploading only supporting business documents specifically requested by Meta;
5. using an available appeal/review process for the existing rejected verification; and
6. opening the appropriate Meta Business Support case if no direct correction/resubmission/appeal route is available.

The durable authorization record is `docs/SHILOH-OS-RECONCILIATION-2026-08-25-META-BUSINESS-VERIFICATION-CONTROL-AUTHORIZATION.md`.

This is a manual external provider-account action by JP. It does not authorize a specialist to broaden provider access or security settings.

If Meta requires a role, system-user, token-scope, asset-assignment, WABA ownership/sharing, phone-registration/ownership, credential or business-ownership mutation to continue, JP must stop and return that exact requirement to 00 before making it.

## Completion evidence for the external provider gate

After remediation, Meta itself must report Business verification as verified/approved before the Shiloh template-creation path can advance.

If no direct remediation path exists, an opened Meta Business Support case is the correct terminal state for JP's current action while provider review remains pending.

Once Meta reports the business verified, 30 must perform read-only provider verification that:

- Business verification is `verified`; and
- the business-level provider limitation/health restriction has cleared.

Template creation remains separately gated and requires fresh 00 authorization.

## Security and activation holds

All prior staff-auth/session/Calendar security controls remain authoritative.

- No additional `shiloh_staff_auth_otp_v1` creation request.
- No free-form OTP fallback.
- No real staff-auth WhatsApp message.
- No new Christel challenge.
- No token-scope escalation.
- No human/system-user role or task-assignment change.
- No WABA ownership/partner-sharing change.
- No phone-registration/ownership change.
- No broad staff Calendar activation.
- No Calendar create/reschedule/cancel/drag-drop or schedule/block/leave writes.
- No Google Calendar authority weakening/removal/optionality.

## Subsequent activation order

1. JP completes the bounded Meta Business-verification correction/resubmission/appeal or Meta Support path.
2. 30 verifies read-only that Business verification is `verified` and the business-level restriction has cleared.
3. 00 separately authorizes exactly one creation/submission of `shiloh_staff_auth_otp_v1`.
4. Meta must report APPROVED and exact Shiloh provider readback must pass.
5. 00 separately authorizes one bounded genuine Christel read-only Calendar pilot challenge.
6. Successful pilot routes immediately to `SHILOH-CALENDAR-CREATE-BOOKING` under 10 — Booking & Admin UX.
