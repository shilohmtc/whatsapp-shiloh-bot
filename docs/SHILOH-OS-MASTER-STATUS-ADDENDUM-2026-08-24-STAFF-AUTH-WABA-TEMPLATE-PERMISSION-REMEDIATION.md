# Shiloh OS — Master Status Addendum — Staff Auth WABA Template Permission Remediation

Date: 2026-08-25
Owner: 00 — Control & Reconciliation

## Verified operational truth

The application-side staff-auth WhatsApp delivery repair remains complete and verified live. The exact Authentication OTP template `shiloh_staff_auth_otp_v1` (`en_US`) still does not exist, and no additional creation attempt has been made.

PR #472 added a default-off, GET-only, sanitized Meta/WABA permission diagnostic. CI passed on Node 24.14.1 with full regression 1007/1007, zero failures/cancellations/skips and zero npm vulnerabilities.

The diagnostic was deployed on exact application commit `2c9468363065531f5e56244e17f83bf306ff9a7a`. A clean audit-OFF baseline was verified, one bounded read-only audit was executed, and the audit flag was immediately restored OFF. Re-lock deploy `dep-da6fr2710e5c73bit11g` is LIVE and healthy.

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

`SHILOH-META-WABA-TEMPLATE-CREATION-PERMISSION-REMEDIATION` is BLOCKED at a genuine Meta business-verification gate.

The minimum justified next action is to remediate the rejected Meta Business verification state through authenticated Meta Business administration. Broadening token scopes, changing human/system-user roles, altering WABA asset assignments or changing ownership is not justified by the evidence and is not authorized as a workaround.

JP/Control must review Meta's rejected Business verification, correct/resubmit/appeal it using accurate business details and provider-requested supporting evidence, or use Meta Business Support if no direct remediation route is available.

After Meta reports the business as verified, 30 must perform read-only provider verification that the business-level limitation is cleared. Template creation remains separately gated and requires fresh 00 authorization.

## Security and activation holds

All prior staff-auth/session/Calendar security controls remain authoritative.

- No additional `shiloh_staff_auth_otp_v1` creation request.
- No free-form OTP fallback.
- No real staff-auth WhatsApp message.
- No new Christel challenge.
- No broad staff Calendar activation.
- No Calendar create/reschedule/cancel/drag-drop or schedule/block/leave writes.
- No Google Calendar authority weakening/removal/optionality.

## Subsequent activation order

1. 00 accepts this provider diagnosis and authorizes the exact external Meta Business-verification remediation.
2. JP/Control completes the provider verification correction/resubmission/appeal or Meta Support path.
3. 30 verifies read-only that business verification is `verified` and the business-level restriction is cleared.
4. 00 separately authorizes exactly one creation/submission of `shiloh_staff_auth_otp_v1`.
5. Meta must report APPROVED and exact Shiloh provider readback must pass.
6. 00 separately authorizes one bounded genuine Christel read-only Calendar pilot challenge.
7. Successful pilot routes immediately to `SHILOH-CALENDAR-CREATE-BOOKING` under 10 — Booking & Admin UX.
